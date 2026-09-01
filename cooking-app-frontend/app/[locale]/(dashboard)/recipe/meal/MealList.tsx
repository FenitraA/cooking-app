"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { getErrorMessage, UnauthorizedError } from "@/lib/errors";
import {
  Beef,
  CalendarArrowDown,
  CalendarArrowUp,
  Notebook,
  RefreshCcw,
  X,
} from "lucide-react";
import FilterField from "@/components/forms/FilterField";
import CustomPagination from "@/components/forms/CustomPagination";
import {
  MealIngredientRead,
  MealRead,
  MealSearchParams,
  MealSearchResult,
} from "@/lib/recipe/types";
import { fetchMealSearch } from "@/lib/recipe/api";
import {
  formatDateFR,
  formatNumber,
  formatNumberToCurrency,
  getMealIngredientStockDescription,
} from "@/lib/utils";
import { Modal, ModalBody } from "flowbite-react";

export default function MealListPage({
  refreshKey,
  refreshTrigger,
}: {
  refreshKey: number;
  refreshTrigger?: () => void;
}) {
  const router = useRouter();
  const translations = useTranslations("Meal");
  const general_translations = useTranslations("General");

  const [mealSearchParams, setMealSearchParams] = useState<MealSearchParams>({
    limit: 50,
    offset: 0,
    recipe_name: undefined,
    start_date: undefined,
    end_date: undefined,
  });

  const debouncedSearchParams = useDebounce(mealSearchParams, 400);

  const [openIngredientsModal, setOpenIngredientsModal] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meals, setMeals] = useState<MealRead[]>([]);

  const [actualMealIngredients, setActualMealIngredients] = useState<
    MealIngredientRead[]
  >([]);

  const pagination = useMemo(() => {
    const perPage = Math.max(1, mealSearchParams.limit ?? 50);
    const currentPage =
      Math.floor((mealSearchParams.offset ?? 0) / perPage) + 1;
    const totalPages = Math.max(1, Math.ceil((total ?? 0) / perPage));
    return { currentPage, perPage, totalPages };
  }, [mealSearchParams.limit, mealSearchParams.offset, total]);

  function onPageChange(newPage: number) {
    const perPage = Math.max(1, mealSearchParams.limit ?? 50);
    setMealSearchParams((p) => ({
      ...p,
      offset: (newPage - 1) * perPage,
    }));
  }

  function setRecipeName(v: string) {
    setMealSearchParams((p) => ({
      ...p,
      recipe_name: v || undefined,
      offset: 0,
    }));
  }
  function setStartDate(v: string) {
    setMealSearchParams((p) => ({
      ...p,
      start_date: v || undefined,
      offset: 0,
    }));
  }
  function setEndDate(v: string) {
    setMealSearchParams((p) => ({
      ...p,
      end_date: v || undefined,
      offset: 0,
    }));
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const data: MealSearchResult = await fetchMealSearch(
          debouncedSearchParams,
        );

        setTotal(data.total);
        setMeals(data.items);
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

  return (
    <div className="rounded-xl w-full mx-auto min-h-full space-y-6">
      <header className="relative mx-1 flex items-center justify-center rounded-xl border border-custom-sand-dune/30 bg-custom-sand-dune/5 px-6 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight text-custom-sand-dune">
            {translations("list_title")}
          </h1>
        </div>
      </header>

      <div className="flex flex-col space-y-4">
        {error && (
          <div className="rounded-lg bg-white/10 px-3 py-2 text-sm text-red-500">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end mb-3">
          <div className="col-span-1">
            <FilterField
              icon={Notebook}
              value={mealSearchParams.recipe_name ?? ""}
              onChange={setRecipeName}
              placeholder={translations("filters.recipe_name")}
            />
          </div>

          <div className="col-span-1">
            <FilterField
              type="date"
              icon={CalendarArrowDown}
              value={String(mealSearchParams.start_date ?? "")}
              onChange={setStartDate}
              placeholder={translations("filters.start_date")}
            />
          </div>

          <div className="col-span-1">
            <FilterField
              type="date"
              icon={CalendarArrowUp}
              value={String(mealSearchParams.end_date ?? "")}
              onChange={setEndDate}
              placeholder={translations("filters.end_date")}
            />
          </div>
        </div>

        <div className="relative flex-1 border-t pt-5 border-white/20 mb-3">
          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-xl">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-gray-800" />
            </div>
          )}

          {/* <div className="text-xs text-gray-400 ml-2 mb-2">
            {translations("count_label")} :{" "}
            <span className="text-gray-700 font-bold">{total}</span>
          </div> */}

          <div className="overflow-x-auto overflow-y-auto max-h-[50vh] lg:h-125">
            <table className="w-full min-w-150 table-fixed ">
              <thead className="sticky top-0 z-10 text-sm text-left text-white ">
                <tr>
                  <th className="bg-gray-500 py-2 px-4  border-r border-white/20 rounded-tl-xl">
                    {translations("table.recipe_name")}
                  </th>
                  <th className="bg-gray-500 py-2 px-4 border-r border-white/20">
                    {translations("table.nb_serving")}
                  </th>
                  <th className="bg-gray-500 py-2 px-4 border-r border-white/20">
                    {translations("table.total_cost")}
                  </th>
                  <th className="bg-gray-500 py-2 px-4 border-r border-white/20">
                    {translations("table.date")}
                  </th>
                  <th
                    className="bg-gray-500 py-2 pl-4 pr-8 w-10 rounded-tr-xl cursor-pointer"
                    onClick={() => {
                      refreshTrigger?.();
                    }}
                  >
                    <RefreshCcw size={16} />
                  </th>
                </tr>
              </thead>

              <tbody>
                {meals.map((item) => (
                  <tr
                    key={item.meal.id}
                    className="text-gray-300 text-sm border-b border-white/20"
                  >
                    <td className="py-2 px-4 border-x border-white/20">
                      {item.recipe_name}
                    </td>
                    <td className="py-2 px-4 border-r border-white/20">
                      {item.meal.nb_serving}
                    </td>
                    <td className="py-2 px-4 border-r border-white/20">
                      {formatNumberToCurrency(item.total_cost_price)}
                    </td>
                    <td className="py-2 px-4 border-r border-white/20">
                      {formatDateFR(item.meal.created_at || "")}
                    </td>
                    <td className="py-2 px-4 border-r border-white/20">
                      <Beef
                        size={16}
                        className="text-gray-300 hover:text-gray-100 cursor-pointer"
                        onClick={() => {
                          setOpenIngredientsModal(true);
                          setActualMealIngredients(item.meal_ingredients);
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="relative flex flex-row justify-center bg-white/10 border p-2 rounded-xl border-white/20 overflow-auto shadow-hard-br">
          <div className="flex overflow-x-auto">
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
        size="2xl"
        show={openIngredientsModal}
        onClose={() => setOpenIngredientsModal(false)}
      >
        <ModalBody className="bg-custom-dark-blue border border-custom-sand-dune">
          <div className="flex text-xl text-custom-sand-dune flex-row justify-between w-full mb-3 pb-3 border-b border-custom-sand-dune">
            <h2>{translations("ingredients_list")}</h2>
            <button
              className="flex justify-center items-center cursor-pointer h-6 w-6 border border-custom-sand-dune rounded-full text-custom-sand-dune hover:bg-custom-sand-dune/20"
              onClick={() => setOpenIngredientsModal(false)}
              aria-label={general_translations("actions.select")}
            >
              <X size={16} />
            </button>
          </div>

          {actualMealIngredients.length > 0 && (
            <div className="mt-3 space-y-2 pt-4 border-t border-white/20 pb-6 flex flex-col max-h-[40vh] overflow-auto">
              {actualMealIngredients.map((item) => (
                <div
                  key={item.meal_ingredient_base.ref_ingredient_stock_id}
                  className="
                    flex
                    items-center
                    justify-between
                    gap-4
                    border-l-4
                    border-custom-sand-dune/50
                    bg-white/10
                    p-3
                    w-full
                  "
                >
                  <div
                    className="
                      flex
                      flex-col
                      gap-2
                      flex-1
                    "
                  >
                    <div className="font-semibold text-gray-300">
                      {item.ingredient_name}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      <span className="text-custom-sand-dune">
                        {formatNumber(item.meal_ingredient_base.quantity)}{" "}
                        {item.ingredient_unit}
                      </span>

                      <span className="text-gray-400">
                        Stock: {getMealIngredientStockDescription(item)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ModalBody>
      </Modal>
    </div>
  );
}
