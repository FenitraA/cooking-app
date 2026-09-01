"use client";

import { useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { getErrorMessage, UnauthorizedError } from "@/lib/errors";
import { Modal, ModalBody } from "flowbite-react";
import {
  Apple,
  ArrowDownAZ,
  Funnel,
  SortAsc,
  SortDesc,
  SquareMinus,
  SwitchCamera,
  X,
} from "lucide-react";
import FilterField from "@/components/forms/FilterField";
import {
  IngredientRead,
  IngredientSearchParams,
  IngredientSearchResult,
  IngredientTypeBase,
} from "@/lib/ingredient/types";
import {
  fetchIngredientsSearch,
  fetchIngredientTypes,
} from "@/lib/ingredient/api";
import GeneralAutocomplete from "@/components/forms/GeneralAutocomplete";
import IngredientDetailsPage from "./Details";
import CustomPagination from "@/components/forms/CustomPagination";
import IngredientCard from "./IngredientCard";
import {
  formatNumber,
  formatNumberToCurrency,
  getIngredientTypeName,
} from "@/lib/utils";
import FilterSelect from "@/components/forms/FilterSelect";
import SafeImage from "@/components/forms/SafeImage";

export default function IngredientListPage({
  refreshKey,
  onRefresh,
}: {
  refreshKey: number;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const translations = useTranslations("Ingredient");
  const general_translations = useTranslations("General");

  const triggerRefresh = () => onRefresh();

  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedIngredientID, setSelectedIngredientID] = useState("");

  const [selectedIngredientType, setSelectedIngredientType] =
    useState<IngredientTypeBase | null>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [ingredientSearchParams, setIngredientSearchParams] =
    useState<IngredientSearchParams>({
      limit: 50,
      offset: 0,
      name: undefined,
      type_id: undefined,
      min_stock: undefined,
      sort_by: undefined,
      sort_direction: "desc",
    });

  const [isDesc, setIsDesc] = useState(true);

  const [isImageViewList, setIsImageViewList] = useState(true);

  const debouncedSearchParams = useDebounce(ingredientSearchParams, 400);

  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<IngredientRead[]>([]);

  const groupedIngredients = useMemo(() => {
    return ingredients.reduce(
      (acc, item) => {
        const groupId = item.ingredient_unit.ref_unit_group_id;

        if (!acc[groupId]) {
          acc[groupId] = [];
        }

        acc[groupId].push(item);
        return acc;
      },
      {} as Record<string, IngredientRead[]>,
    );
  }, [ingredients]);

  const pagination = useMemo(() => {
    const perPage = Math.max(1, ingredientSearchParams.limit ?? 50);
    const currentPage =
      Math.floor((ingredientSearchParams.offset ?? 0) / perPage) + 1;
    const totalPages = Math.max(1, Math.ceil((total ?? 0) / perPage));
    return { currentPage, perPage, totalPages };
  }, [ingredientSearchParams.limit, ingredientSearchParams.offset, total]);

  function onPageChange(newPage: number) {
    const perPage = Math.max(1, ingredientSearchParams.limit ?? 50);
    setIngredientSearchParams((p) => ({
      ...p,
      offset: (newPage - 1) * perPage,
    }));
  }

  function setSortBy(v: string) {
    console.log(v);
    setIngredientSearchParams((p) => ({
      ...p,
      sort_by: v || undefined,
      offset: 0,
    }));
  }
  function setSortDirection() {
    setIngredientSearchParams((p) => ({
      ...p,
      sort_direction: p.sort_direction === "desc" ? "asc" : "desc",
      offset: 0,
    }));

    setIsDesc((p) => !p);
  }

  function setName(v: string) {
    setIngredientSearchParams((p) => ({
      ...p,
      name: v || undefined,
      offset: 0,
    }));
  }
  function setMinStock(v: string) {
    setIngredientSearchParams((p) => ({
      ...p,
      min_stock: v || undefined,
      offset: 0,
    }));
  }

  function changeListType() {
    setIsImageViewList((p) => !p);
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const data: IngredientSearchResult = await fetchIngredientsSearch(
          debouncedSearchParams,
        );

        setTotal(data.total);
        setIngredients(data.items);
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

  function preview_image(imageUrl: string) {
    setSelectedImage(imageUrl);
  }

  // Filter section control
  const [openFilters, setOpenFilters] = useState(false);

  function changeOpenFilter() {
    setOpenFilters((p) => !p);
  }

  const Filters = (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 items-end">
      <FilterField
        icon={Apple}
        value={ingredientSearchParams.name ?? ""}
        onChange={setName}
        placeholder={translations("filters.name")}
      />

      <FilterField
        icon={SquareMinus}
        value={String(ingredientSearchParams.min_stock ?? "")}
        onChange={setMinStock}
        placeholder={translations("filters.min_stock")}
      />
      <GeneralAutocomplete<IngredientTypeBase>
        translationsKey="IngredientType"
        showShadow={false}
        value={selectedIngredientType}
        onSelect={(d) => {
          setSelectedIngredientType(d);
          setIngredientSearchParams((p) => ({ ...p, type_id: d.id }));
        }}
        onClear={() => {
          setSelectedIngredientType(null);
          setIngredientSearchParams((p) => ({ ...p, type_id: undefined }));
        }}
        getName={getIngredientTypeName}
        fetchOptions={fetchIngredientTypes}
      />
      <div className="flex flex-row gap-3">
        <FilterSelect<string>
          value={ingredientSearchParams.sort_by || ""}
          icon={ArrowDownAZ}
          onChange={setSortBy}
          className="flex-1"
          placeholder="Sort by"
          options={[
            { value: "", label: "None" },
            { value: "quantity_left", label: "Stock" },
            { value: "unit_cost", label: "Price" },
          ]}
        />
        <button
          type="button"
          onClick={setSortDirection}
          className="h-10 border border-white/20 px-3 rounded-lg bg-white/10 text-gray-300 cursor-pointer hover:bg-white/20 "
        >
          {isDesc ? <SortDesc size={18} /> : <SortAsc size={18} />}
        </button>
      </div>
      <div
        onClick={() => setIsImageViewList(!isImageViewList)}
        className="flex flex-row gap-6 justify-center items-center h-10 border border-white/20 px-3 rounded-lg bg-white/10 text-gray-300 cursor-pointer hover:bg-white/20 "
      >
        <SwitchCamera size={20} onClick={changeListType} />
        <span className="mr-2">
          {general_translations("actions.change_view")}
        </span>{" "}
      </div>
    </div>
  );

  return (
    <div className="rounded-xl border w-full mx-auto min-h-full bg-white/10 py-4 px-2 sm:px-6 shadow-hard-br space-y-6">
      <header className="relative mb-4 mx-1 flex items-center justify-center rounded-xl border border-custom-sand-dune/30 bg-custom-sand-dune/5 px-6 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight text-custom-sand-dune">
            {translations("list_title")}
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

      <div className="flex flex-col h-full">
        {error && (
          <div className="rounded-lg bg-white/10 px-3 py-2 text-sm text-red-500">
            {error}
          </div>
        )}
        <div className="hidden lg:block mb-3">{Filters}</div>
        <div
          className={`
            lg:hidden
            overflow-hidden
            transition-all
            duration-300
            my-2
            ${openFilters ? "max-h-125 opacity-100" : "max-h-1 opacity-0"}
          `}
        >
          {Filters}
        </div>
        <div className="relative flex-1 bg-white/10 border border-white/20 p-2 rounded-xl shadow-hard-br mb-3">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-xl">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-gray-800" />
            </div>
          )}

          {/* <div className="text-xs text-gray-400 ml-2 mb-2">
            {translations("count_label")} :{" "}
            <span className="text-gray-700 font-bold">{total}</span>
          </div> */}

          {isImageViewList && (
            <div
              className="
              grid
              grid-cols-[repeat(auto-fill,minmax(220px,1fr))]
              gap-4
              overflow-y-auto
              h-[60vh] lg:h-150
            "
            >
              {Object.entries(groupedIngredients).map(([groupId, group]) => (
                <div key={groupId} className="col-span-full">
                  {/* Divider */}
                  <div
                    className="
                    grid
                    grid-cols-[repeat(auto-fill,minmax(220px,1fr))]
                    gap-4
                  "
                  >
                    {group.map((item) => (
                      <div
                        key={item.ingredient.id}
                        className="relative rounded-xl h-auto w-full cursor-pointer px-3"
                        onClick={() => {
                          setOpenEditModal(true);
                          setSelectedIngredientID(item.ingredient.id);
                        }}
                      >
                        <IngredientCard
                          ingredientId={item.ingredient.id}
                          name={item.ingredient.name}
                          imageUrl={item.ingredient.image_url}
                          unit={item.ingredient_unit.symbol}
                          estimatedPrice={Number(
                            item.ingredient.estimated_price,
                          )}
                          quantityLeft={item.quantity_left}
                          ingredientType={item.ingredient_type.name}
                          onImageClick={preview_image}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-custom-sand-dune mt-8 w-11/12 mx-auto" />
                </div>
              ))}
            </div>
          )}

          {!isImageViewList && (
            <div className="overflow-x-auto overflow-y-auto min-h-50 max-h-[50vh] lg:h-125">
              <table className="w-full min-w-150 table-fixed ">
                <thead className="sticky top-0 z-10 text-sm text-left text-white ">
                  <tr>
                    <th className="bg-gray-500 py-2 px-4  border-r border-white/20 rounded-tl-xl">
                      {translations("table.name")}
                    </th>
                    <th className="bg-gray-500 py-2 px-4 border-r border-white/20">
                      {translations("table.estimated_price")}
                    </th>
                    <th className="bg-gray-500 py-2 px-4 border-r border-white/20">
                      {translations("table.quantity_left")}
                    </th>
                    <th className="bg-gray-500 py-2 px-4 border-r border-white/20">
                      {translations("table.ingredient_type")}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {Object.entries(groupedIngredients).map(
                    ([groupId, group]) => (
                      <Fragment key={groupId}>
                        <tr className="bg-white/10">
                          <td
                            colSpan={4}
                            className="px-4 py-2 font-semibold text-white border-y border-white/20"
                          >
                            {group[0].group_name}
                          </td>
                        </tr>

                        {group.map((item) => (
                          <tr
                            key={item.ingredient.id}
                            className="text-gray-300 text-sm border-b border-white/20"
                          >
                            <td className="py-2 px-4 border-x border-white/20">
                              {item.ingredient.name}
                            </td>
                            <td className="py-2 px-4 border-r border-white/20">
                              {formatNumberToCurrency(
                                item.ingredient.estimated_price,
                              )}{" "}
                              / {item.ingredient_unit.name}
                            </td>
                            <td className="py-2 px-4 border-r border-white/20">
                              {formatNumber(item.quantity_left)}{" "}
                              {item.ingredient_unit.name}
                            </td>
                            <td className="py-2 px-4 border-r border-white/20">
                              {item.ingredient_type.name}
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="relative flex flex-row justify-center bg-white/10 border p-2 rounded-xl border-white/20 overflow-auto shadow-hard-br">
          <div className="overflow-x-auto">
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

      <Modal
        size="7xl"
        show={openEditModal}
        onClose={() => setOpenEditModal(false)}
      >
        <ModalBody className="bg-custom-dark-blue border border-custom-sand-dune">
          <div className="flex text-xl text-custom-sand-dune flex-row justify-between w-full mb-3 pb-3 border-b border-custom-sand-dune">
            <h2>{translations("edit_title")}</h2>
            <button
              className="flex justify-center items-center cursor-pointer h-6 w-6 border border-custom-sand-dune rounded-full text-custom-sand-dune hover:bg-custom-sand-dune/20"
              onClick={() => setOpenEditModal(false)}
              aria-label={general_translations("actions.select")}
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-6">
            <IngredientDetailsPage
              ingredientID={selectedIngredientID}
              onUpdated={triggerRefresh}
            />
          </div>
        </ModalBody>
      </Modal>

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl w-full h-[80vh] mx-4">
            <SafeImage
              src={selectedImage}
              alt="Full view"
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
