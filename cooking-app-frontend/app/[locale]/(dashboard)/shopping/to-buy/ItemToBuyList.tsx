"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { getErrorMessage, UnauthorizedError } from "@/lib/errors";
import {
  PackagePlus,
  CheckSquare,
  Square,
  ShoppingCart,
  Loader2,
  PenBox,
  SquareX,
  SquareCheck,
  Undo2,
} from "lucide-react";
import FilterField from "@/components/forms/FilterField";
import CustomPagination from "@/components/forms/CustomPagination";
import {
  ItemToBuyRead,
  ItemToBuySearchParams,
  ItemToBuySearchResult,
  ItemToBuyUpdateData,
  ShoppingBase,
  ShoppingCreate,
  ShoppingCreateFromItemsToBuy,
} from "@/lib/shopping/types";
import {
  createShopping,
  createShoppingFromItemsToBuy,
  deleteItemToBuy,
  fetchItemToBuySearch,
  updateItemToBuy,
} from "@/lib/shopping/api";
import GeneralAutocomplete from "@/components/forms/GeneralAutocomplete";
import { IngredientBase } from "@/lib/ingredient/types";
import {
  formatNumber,
  formatNumberToCurrency,
  getIngredientName,
} from "@/lib/utils";
import { fetchIngredientByName } from "@/lib/ingredient/api";
import Field from "@/components/forms/Field";
import { item_to_buy_to_shopping_item } from "@/lib/shopping/services";
import DeleteConfirmModal from "@/components/forms/DeleteConfirmationModal";

export default function ItemToBuyListPage({
  refreshKey,
  onRefresh,
}: {
  refreshKey: number;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const translations = useTranslations("ItemToBuy");
  const general_translations = useTranslations("General");

  const [itemToBuySearchParams, setItemToBuySearchParams] =
    useState<ItemToBuySearchParams>({
      limit: 50,
      offset: 0,
      name: undefined,
      ingredient_id: undefined,
    });

  const debouncedSearchParams = useDebounce(itemToBuySearchParams, 400);

  const [itemToBuyIDToDelete, setItemToBuyIDToDelete] = useState("");

  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [itemsToBuy, setItemsToBuy] = useState<ItemToBuyRead[]>([]);

  const [shopping, setShopping] = useState<ShoppingBase>({
    id: "",
    shopping_date: "",
    description: "",
    ref_household_id: "",
  });
  const [selectedIngredient, setSelectedIngredient] =
    useState<IngredientBase | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [editData, setEditData] = useState<ItemToBuyUpdateData>({
    id: "",
    estimated_unit_price: "0",
    units_to_buy: "0",
  });

  // submittting states
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  //  Selection & Gathering States
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isGathering, setIsGathering] = useState(false);

  const pagination = useMemo(() => {
    const perPage = Math.max(1, itemToBuySearchParams.limit ?? 50);
    const currentPage =
      Math.floor((itemToBuySearchParams.offset ?? 0) / perPage) + 1;
    const totalPages = Math.max(1, Math.ceil((total ?? 0) / perPage));
    return { currentPage, perPage, totalPages };
  }, [itemToBuySearchParams.limit, itemToBuySearchParams.offset, total]);

  function onPageChange(newPage: number) {
    const perPage = Math.max(1, itemToBuySearchParams.limit ?? 50);
    setItemToBuySearchParams((p) => ({
      ...p,
      offset: (newPage - 1) * perPage,
    }));
  }

  function setName(v: string) {
    setItemToBuySearchParams((p) => ({
      ...p,
      name: v || undefined,
      offset: 0,
    }));
  }

  function setIngredientId(v: string | null) {
    setItemToBuySearchParams((p) => ({
      ...p,
      ingredient_id: v || undefined,
      offset: 0,
    }));
  }

  // Edit tracking function
  function startEdit(item: ItemToBuyRead) {
    setEditingId(item.item_to_buy.id);

    setEditData({
      id: item.item_to_buy.id,
      estimated_unit_price: String(item.item_to_buy.estimated_unit_price),
      units_to_buy: String(item.item_to_buy.units_to_buy),
    });
  }
  async function saveEdit() {
    await updateItemToBuy(editData);

    setItemsToBuy((prev) =>
      prev.map((item) =>
        item.item_to_buy.id === editData.id
          ? {
              ...item,
              item_to_buy: {
                ...item.item_to_buy,
                units_to_buy: editData.units_to_buy,
                estimated_unit_price: editData.estimated_unit_price,
              },
            }
          : item,
      ),
    );

    setEditingId(null);
  }
  async function handleDeleteItemToBuy() {
    setDeleteLoading(true);
    try {
      await deleteItemToBuy({ item_to_buy_id: itemToBuyIDToDelete });
      onRefresh?.();
    } finally {
      setDeleteLoading(false);
      setOpenDeleteModal(false);
    }
  }
  //  Selection Handlers
  const toggleSelectItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isAllSelected = useMemo(() => {
    if (itemsToBuy.length === 0) return false;
    return itemsToBuy.every((item) => selectedIds.has(item.item_to_buy.id));
  }, [itemsToBuy, selectedIds]);

  const toggleSelectAll = () => {
    if (isAllSelected) {
      // Unselect current page items
      setSelectedIds((prev) => {
        const next = new Set(prev);
        itemsToBuy.forEach((item) => next.delete(item.item_to_buy.id));
        return next;
      });
    } else {
      // Select current page items
      setSelectedIds((prev) => {
        const next = new Set(prev);
        itemsToBuy.forEach((item) => next.add(item.item_to_buy.id));
        return next;
      });
    }
  };

  // Calculate Selected Totals
  const selectedSummary = useMemo(() => {
    const selectedItems = itemsToBuy.filter((item) =>
      selectedIds.has(item.item_to_buy.id),
    );
    const totalCost = selectedItems.reduce(
      (acc, item) =>
        acc +
        Number(item.item_to_buy.units_to_buy) *
          Number(item.item_to_buy.estimated_unit_price),
      0,
    );
    return { count: selectedIds.size, totalCost };
  }, [itemsToBuy, selectedIds]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const data: ItemToBuySearchResult = await fetchItemToBuySearch(
          debouncedSearchParams,
        );

        setTotal(data.total);
        setItemsToBuy(data.items);
      } catch (e: unknown) {
        if (cancelled) return;

        if (e instanceof UnauthorizedError) {
          router.replace("/login");
          return;
        }

        setError(getErrorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [router, debouncedSearchParams, refreshKey]);

  async function handleSubmit() {
    setError(null);
    setSuccess(null);

    if (!shopping.shopping_date.trim())
      return setError(translations("errors.required_shopping_date"));
    if (!selectedIds || selectedIds.size == 0)
      return setError(translations("errors.required_item_selection"));

    setSubmitting(true);

    try {
      let body: ShoppingCreateFromItemsToBuy = {
        ...shopping,
        item_to_buy_ids: [...selectedIds],
      };
      await createShoppingFromItemsToBuy(body);

      setSuccess(translations("success.created"));
      setShopping((v) => ({
        ...v,
        id: "",
        shopping_date: "",
        description: "",
        ref_household_id: "",
      }));
      setSelectedIds(new Set());
      onRefresh?.();
    } catch (e: unknown) {
      if (e instanceof UnauthorizedError) {
        router.replace("/login");
        return;
      }

      const msg = getErrorMessage(e);
      setError(translations("errors.create_failed", { message: msg }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border w-full mx-auto min-h-full bg-white/10 py-4 px-3 sm:px-6 shadow-hard-br space-y-6">
      <header className="text-center mb-4 px-2 py-2 border-b border-custom-sand-dune mx-2 sm:mx-4 mt-2">
        <h2 className="text-md font-semibold text-custom-sand-dune tracking-tight">
          {translations("list_title")}
        </h2>
      </header>

      <div className="flex flex-col space-y-4">
        {error && (
          <div className="rounded-lg bg-white/10 px-3 py-2 text-sm text-red-500">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 items-end mb-3">
          <div className="col-span-1">
            <FilterField
              icon={PackagePlus}
              value={String(itemToBuySearchParams.name ?? "")}
              onChange={setName}
              placeholder={translations("filters.name")}
            />
          </div>

          <div className="col-span-1">
            <GeneralAutocomplete<IngredientBase>
              translationsKey="ItemCategory"
              showShadow={false}
              className="col-span-1"
              value={selectedIngredient}
              onSelect={(d) => {
                setSelectedIngredient(d);
                setIngredientId(d.id);
              }}
              onClear={() => {
                setSelectedIngredient(null);
                setIngredientId(null);
              }}
              getName={getIngredientName}
              fetchOptions={fetchIngredientByName}
            />
          </div>
        </div>

        {/* Select All Bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-lg border border-white/10 text-sm text-gray-300">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex items-center gap-2 hover:text-white transition-colors"
          >
            {isAllSelected ? (
              <CheckSquare className="w-5 h-5 text-custom-sand-dune" />
            ) : (
              <Square className="w-5 h-5" />
            )}
            <span>
              {isAllSelected
                ? (general_translations("actions.deselect_all") ??
                  "Deselect All")
                : (general_translations("actions.select_all") ?? "Select All")}
            </span>
          </button>

          {selectedIds.size > 0 && (
            <span className="text-xs text-custom-sand-dune font-medium">
              {selectedIds.size} {general_translations("items_selected")}
            </span>
          )}
        </div>

        {/* Item List */}
        <div className="flex flex-col gap-3 sm:gap-4 overflow-y-auto h-[60vh] lg:h-150 pr-1">
          {itemsToBuy.map((item) => {
            const isSelected = selectedIds.has(item.item_to_buy.id);
            return (
              <div
                key={item.item_to_buy.id}
                className={`relative flex flex-row items-start sm:items-center w-full px-3 py-2 sm:py-1 bg-white/10 border text-gray-300 transition-colors ${
                  isSelected ? "border-custom-sand-dune" : "border-white/20"
                }`}
              >
                <div
                  className="mr-3 mt-0.5 sm:mt-0 flex items-center cursor-pointer"
                  onClick={() => toggleSelectItem(item.item_to_buy.id)}
                >
                  {isSelected ? (
                    <CheckSquare className="w-5 h-5 text-custom-sand-dune shrink-0" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400 shrink-0" />
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-4 flex-1 w-full">
                  <span className="font-semibold text-base sm:text-sm mt-0.5 sm:mt-0 wrap-break-word">
                    {item.item_to_buy.name}
                  </span>

                  {/* Math & Actions Container */}
                  <div className="flex flex-row flex-wrap items-center gap-2 sm:gap-4 font-medium text-sm w-full sm:w-auto">
                    {/* Price & Quantity Group */}
                    <div className="flex items-center gap-2">
                      <span className="text-custom-money-green">
                        {editingId === item.item_to_buy.id ? (
                          <div className="w-20 sm:w-24">
                            <Field
                              type="decimal"
                              value={editData.estimated_unit_price}
                              onChange={(v) =>
                                setEditData((p) => ({
                                  ...p,
                                  estimated_unit_price: v,
                                }))
                              }
                            />
                          </div>
                        ) : (
                          <span>
                            {formatNumberToCurrency(
                              item.item_to_buy.estimated_unit_price,
                            )}
                          </span>
                        )}
                      </span>
                      <span className="text-custom-sand-dune">x</span>
                      <span className="text-custom-sand-dune">
                        {editingId === item.item_to_buy.id ? (
                          <div className="w-16 sm:w-20">
                            <Field
                              type="decimal"
                              value={editData.units_to_buy}
                              onChange={(v) =>
                                setEditData((p) => ({
                                  ...p,
                                  units_to_buy: v,
                                }))
                              }
                            />
                          </div>
                        ) : (
                          <span>
                            {formatNumber(item.item_to_buy.units_to_buy)}
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Total & Action Buttons Group */}
                    <div className="flex items-center justify-between flex-1 sm:flex-initial gap-4">
                      <span className="text-custom-money-green font-semibold flex items-center gap-1.5">
                        <span>=</span>
                        <span>
                          {formatNumberToCurrency(
                            Number(item.item_to_buy.units_to_buy) *
                              Number(item.item_to_buy.estimated_unit_price),
                          )}
                        </span>
                      </span>

                      <div className="flex gap-2 items-center">
                        {editingId === item.item_to_buy.id ? (
                          <div className="flex gap-2">
                            <button
                              className="text-custom-sand-dune cursor-pointer p-1 -m-1"
                              onClick={saveEdit}
                            >
                              <SquareCheck size={20} />
                            </button>
                            <button
                              className="text-custom-sand-dune cursor-pointer p-1 -m-1"
                              onClick={() => setEditingId(null)}
                            >
                              <Undo2 size={20} />
                            </button>
                          </div>
                        ) : (
                          <button
                            className="text-custom-sand-dune cursor-pointer p-1 -m-1"
                            onClick={() => startEdit(item)}
                          >
                            <PenBox size={18} />
                          </button>
                        )}
                        <button
                          className="text-custom-button-red cursor-pointer p-1 -m-1"
                          onClick={() => {
                            setOpenDeleteModal(true);
                            setItemToBuyIDToDelete(item.item_to_buy.id);
                          }}
                        >
                          <SquareX size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating / Bottom Gathering Action Bar */}
        {selectedIds.size > 0 && (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between p-3 sm:p-4 bg-white/10 border border-custom-sand-dune rounded-xl text-gray-200 gap-4 lg:gap-8 mt-2 shadow-lg">
            <div className="flex flex-row lg:flex-col justify-between lg:justify-start items-center lg:items-start text-sm">
              <span className="text-white">
                {selectedSummary.count} {general_translations("items_selected")}
              </span>
              <span className="text-custom-money-green font-semibold text-lg lg:text-base">
                {formatNumberToCurrency(selectedSummary.totalCost)}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto flex-1">
              <div className="w-full flex-1">
                <Field
                  className="w-full"
                  value={shopping.description}
                  onChange={(v) =>
                    setShopping((p) => ({ ...p, description: v }))
                  }
                  placeholder={translations("fields.description")}
                />
              </div>
              <div className="w-full sm:w-40 shrink-0">
                <Field
                  className="w-full"
                  type="date"
                  value={shopping.shopping_date}
                  onChange={(v) =>
                    setShopping((p) => ({ ...p, shopping_date: v }))
                  }
                />
              </div>

              <button
                type="button"
                disabled={isGathering}
                onClick={handleSubmit}
                className="flex items-center justify-center h-10 w-full sm:w-auto px-6 bg-custom-sand-dune text-gray-900 font-semibold rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50 cursor-pointer shrink-0"
              >
                {isGathering ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShoppingCart className="w-4 h-4" />
                )}
                <span className="ml-2">
                  {translations("actions.register_shopping")}
                </span>
              </button>
            </div>
          </div>
        )}

        <div className="relative flex flex-row justify-center bg-white/10 border p-2 rounded-xl border-white/20 overflow-auto shadow-hard-br">
          <div className="flex overflow-x-auto min-w-0 max-w-full pb-1">
            <CustomPagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={onPageChange}
              previousLabel={general_translations("actions.previous")}
              nextLabel={general_translations("actions.next")}
              showIcons
            />
          </div>
        </div>
      </div>
      <DeleteConfirmModal
        open={openDeleteModal}
        onCancel={() => setOpenDeleteModal(false)}
        onConfirm={handleDeleteItemToBuy}
        loading={deleteLoading}
      />
    </div>
  );
}
