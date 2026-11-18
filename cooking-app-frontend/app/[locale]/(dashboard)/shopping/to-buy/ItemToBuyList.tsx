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
  Funnel,
} from "lucide-react";
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
import { itemToBuyToShoppingItem } from "@/lib/shopping/services";
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
  const generalTranslations = useTranslations("General");

  const [itemToBuySearchParams, setItemToBuySearchParams] =
    useState<ItemToBuySearchParams>({
      limit: 50,
      offset: 0,
      name: undefined,
      ingredientId: undefined,
    });

  const debouncedSearchParams = useDebounce(itemToBuySearchParams, 400);

  const [itemToBuyIDToDelete, setItemToBuyIDToDelete] = useState("");

  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const [itemsToBuy, setItemsToBuy] = useState<ItemToBuyRead[]>([]);

  const [shopping, setShopping] = useState<ShoppingBase>({
    id: "",
    shoppingDate: "",
    description: "",
    refHouseholdId: "",
  });
  const [selectedIngredient, setSelectedIngredient] =
    useState<IngredientBase | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [editData, setEditData] = useState<ItemToBuyUpdateData>({
    id: "",
    estimatedUnitPrice: "0",
    unitsToBuy: "0",
  });

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
      ingredientId: v || undefined,
      offset: 0,
    }));
  }

  // Edit tracking function
  function startEdit(item: ItemToBuyRead) {
    setEditingId(item.itemToBuy.id);

    setEditData({
      id: item.itemToBuy.id,
      estimatedUnitPrice: String(Number(item.itemToBuy.estimatedUnitPrice)),
      unitsToBuy: String(Number(item.itemToBuy.unitsToBuy)),
    });
  }
  async function saveEdit() {
    if (editLoading) return;

    setEditLoading(true);
    setError(null);

    try {
      await updateItemToBuy(editData);

      setItemsToBuy((prev) =>
        prev.map((item) =>
          item.itemToBuy.id === editData.id
            ? {
                ...item,
                itemToBuy: {
                  ...item.itemToBuy,
                  unitsToBuy: editData.unitsToBuy,
                  estimatedUnitPrice: editData.estimatedUnitPrice,
                },
              }
            : item,
        ),
      );

      setEditingId(null);
    } catch (e: unknown) {
      if (e instanceof UnauthorizedError) {
        router.replace("/login");
        return;
      }

      const msg = getErrorMessage(e);
      setError(msg);
    } finally {
      setEditLoading(false);
    }
  }
  async function handleDeleteItemToBuy() {
    setDeleteLoading(true);
    try {
      await deleteItemToBuy({ itemToBuyId: itemToBuyIDToDelete });
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
    return itemsToBuy.every((item) => selectedIds.has(item.itemToBuy.id));
  }, [itemsToBuy, selectedIds]);

  const toggleSelectAll = () => {
    if (isAllSelected) {
      // Unselect current page items
      setSelectedIds((prev) => {
        const next = new Set(prev);
        itemsToBuy.forEach((item) => next.delete(item.itemToBuy.id));
        return next;
      });
    } else {
      // Select current page items
      setSelectedIds((prev) => {
        const next = new Set(prev);
        itemsToBuy.forEach((item) => next.add(item.itemToBuy.id));
        return next;
      });
    }
  };

  // Calculate Selected Totals
  const selectedSummary = useMemo(() => {
    const selectedItems = itemsToBuy.filter((item) =>
      selectedIds.has(item.itemToBuy.id),
    );
    const totalCost = selectedItems.reduce(
      (acc, item) =>
        acc +
        Number(item.itemToBuy.unitsToBuy) *
          Number(item.itemToBuy.estimatedUnitPrice),
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
    if (!shopping.shoppingDate.trim())
      return setError(translations("errors.requiredShoppingDate"));
    if (!selectedIds || selectedIds.size == 0)
      return setError(translations("errors.requiredItemSelection"));

    setIsGathering(true);

    try {
      let body: ShoppingCreateFromItemsToBuy = {
        ...shopping,
        itemToBuyIds: [...selectedIds],
      };
      await createShoppingFromItemsToBuy(body);

      setShopping((v) => ({
        ...v,
        id: "",
        shoppingDate: "",
        description: "",
        refHouseholdId: "",
      }));
      setSelectedIds(new Set());
      onRefresh?.();
    } catch (e: unknown) {
      if (e instanceof UnauthorizedError) {
        router.replace("/login");
        return;
      }

      const msg = getErrorMessage(e);
      setError(translations("errors.createFailed", { message: msg }));
    } finally {
      setIsGathering(false);
    }
  }
  // Filter section control
  const [openFilters, setOpenFilters] = useState(false);

  function changeOpenFilter() {
    setOpenFilters((p) => !p);
  }
  const Filters = (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 items-end mb-3">
      <div className="col-span-1">
        <Field
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
  );

  return (
    <div className="rounded-xl border w-full mx-auto min-h-full bg-white/10 py-4 px-3 sm:px-6 shadow-hard-br space-y-6">
      <header className="relative mb-4 mx-1 flex items-center justify-center rounded-xl border border-custom-sand-dune/30 bg-custom-sand-dune/5 px-6 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight text-custom-sand-dune">
            {translations("listTitle")}
          </h1>
        </div>

        <div className="lg:hidden absolute right-2">
          <button
            type="button"
            onClick={changeOpenFilter}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-300 transition-all hover:border-custom-sand-dune/40 hover:bg-custom-sand-dune/10 hover:text-custom-sand-dune"
          >
            <Funnel size={16} />
          </button>
        </div>
      </header>

      <div className="flex flex-col space-y-4">
        <div className="hidden lg:block mb-3">{Filters}</div>
        <div
          className={`
            lg:hidden
            transition-all
            duration-300
            ${openFilters ? "max-h-125 opacity-100" : "max-h-1 opacity-0"}
          `}
        >
          {Filters}
        </div>

        {error && (
          <div className="rounded-lg bg-white/10 px-3 py-2 text-sm text-red-500">
            {error}
          </div>
        )}

        {/* Select All Bar */}
        <div className="relative flex items-center justify-between px-3 py-2 bg-white/5 rounded-lg border border-white/10 text-sm text-gray-300">
          <div
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
                ? (generalTranslations("actions.deselectAll") ?? "Deselect All")
                : (generalTranslations("actions.selectAll") ?? "Select All")}
            </span>
          </div>

          {selectedIds.size > 0 && (
            <span className="text-xs text-custom-sand-dune font-medium">
              {selectedIds.size} {generalTranslations("itemsSelected")}
            </span>
          )}
        </div>

        {/* Item List */}
        <div className="relative flex flex-col gap-3 sm:gap-4 overflow-y-auto h-[60vh] lg:h-150 pr-1">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-gray-800" />
            </div>
          )}

          {itemsToBuy.map((item) => {
            const id = item.itemToBuy.id;
            const isSelected = selectedIds.has(id);
            const isEditing = editingId === id;

            const totalPrice =
              Number(item.itemToBuy.unitsToBuy) *
              Number(item.itemToBuy.estimatedUnitPrice);

            return (
              <div
                key={id}
                className={`
    group relative rounded-xl border px-3 py-2.5
    transition-all duration-200
    ${
      isSelected
        ? "bg-custom-sand-dune/10 border-custom-sand-dune/70 shadow-sm"
        : "border-white/10 bg-white/5 hover:border-custom-sand-dune/30 hover:bg-white/8"
    }
  `}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-5">
                  {/* Selection + Name */}
                  <div className="flex items-center gap-2.5 min-w-0 lg:flex-1">
                    <button
                      type="button"
                      onClick={() => toggleSelectItem(id)}
                      aria-label={isSelected ? "Deselect item" : "Select item"}
                      aria-pressed={isSelected}
                      className="shrink-0 transition-transform hover:scale-110"
                    >
                      {isSelected ? (
                        <CheckSquare
                          size={19}
                          className="text-custom-sand-dune"
                        />
                      ) : (
                        <Square
                          size={19}
                          className="text-gray-500 group-hover:text-custom-sand-dune"
                        />
                      )}
                    </button>

                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-gray-100 truncate">
                        {item.itemToBuy.name}
                      </h3>
                      <p className="text-[11px] text-gray-500">
                        {item.ingredientUnit ?? "pc"} 
                      </p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-3 gap-2 lg:gap-5 lg:w-auto lg:flex lg:items-center">
                    {/* Unit price */}
                    <div className="min-w-0">
                      <p className="text-[9px] uppercase tracking-wider text-gray-500 mb-1">
                        Unit price
                      </p>

                      {isEditing ? (
                        <Field
                          id={`price-${id}`}
                          type="decimal"
                          value={editData.estimatedUnitPrice}
                          onChange={(v) =>
                            setEditData((p) => ({
                              ...p,
                              estimatedUnitPrice: v,
                            }))
                          }
                        />
                      ) : (
                        <p className="font-semibold text-xs text-custom-money-green truncate">
                          {formatNumberToCurrency(
                            item.itemToBuy.estimatedUnitPrice,
                          )}
                        </p>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="min-w-0 lg:w-28">
                      <p className="text-[9px] uppercase tracking-wider text-gray-500 mb-1">
                        Quantity
                      </p>

                      {isEditing ? (
                        <Field
                          id={`quantity-${id}`}
                          type="decimal"
                          value={editData.unitsToBuy}
                          onChange={(v) =>
                            setEditData((p) => ({
                              ...p,
                              unitsToBuy: v,
                            }))
                          }
                        />
                      ) : (
                        <p className="font-semibold text-xs text-gray-200 truncate">
                          {formatNumber(item.itemToBuy.unitsToBuy)}{" "}
                          {item.ingredientUnit ?? "pc"}
                        </p>
                      )}
                    </div>

                    {/* Total */}
                    <div className="min-w-0 lg:w-32">
                      <p className="text-[9px] uppercase tracking-wider text-gray-500 mb-1">
                        Total
                      </p>

                      <p className="font-bold text-sm text-custom-money-green truncate">
                        {formatNumberToCurrency(
                          isEditing
                            ? Number(editData.unitsToBuy) *
                                Number(editData.estimatedUnitPrice)
                            : totalPrice,
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 justify-end lg:border-l lg:border-white/10 lg:pl-3">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          disabled={editLoading}
                          onClick={saveEdit}
                          aria-label="Save changes"
                          className="p-1.5 rounded-lg text-custom-sand-dune hover:bg-custom-sand-dune/10 disabled:opacity-50"
                        >
                          {editLoading ? (
                            <Loader2 size={17} className="animate-spin" />
                          ) : (
                            <SquareCheck size={17} />
                          )}
                        </button>

                        <button
                          type="button"
                          disabled={editLoading}
                          onClick={() => setEditingId(null)}
                          aria-label="Cancel editing"
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-white/10 disabled:opacity-50"
                        >
                          <Undo2 size={17} />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        aria-label="Edit item"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-custom-sand-dune hover:bg-custom-sand-dune/10"
                      >
                        <PenBox size={17} />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setOpenDeleteModal(true);
                        setItemToBuyIDToDelete(id);
                      }}
                      aria-label="Delete item"
                      className="p-1.5 rounded-lg text-gray-500 hover:text-custom-button-red hover:bg-red-500/10"
                    >
                      <SquareX size={17} />
                    </button>
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
                {selectedSummary.count} {generalTranslations("itemsSelected")}
              </span>
              <span className="text-custom-money-green font-semibold text-lg lg:text-base">
                {formatNumberToCurrency(selectedSummary.totalCost)}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto flex-1">
              <div className="w-full flex-1">
                <Field
                  id="description"
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
                  id="shoppingDate"
                  className="w-full"
                  type="date"
                  value={shopping.shoppingDate}
                  onChange={(v) =>
                    setShopping((p) => ({ ...p, shoppingDate: v }))
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
                  {translations("actions.registerShopping")}
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
              previousLabel={generalTranslations("actions.previous")}
              nextLabel={generalTranslations("actions.next")}
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
