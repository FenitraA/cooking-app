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
import Field from "@/components/forms/Field";
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
  const generalTranslations = useTranslations("General");

  const [mealSearchParams, setMealSearchParams] = useState<MealSearchParams>({
    limit: 50,
    offset: 0,
    recipeName: undefined,
    startDate: undefined,
    endDate: undefined,
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
      recipeName: v || undefined,
      offset: 0,
    }));
  }
  function setStartDate(v: string) {
    setMealSearchParams((p) => ({
      ...p,
      startDate: v || undefined,
      offset: 0,
    }));
  }
  function setEndDate(v: string) {
    setMealSearchParams((p) => ({
      ...p,
      endDate: v || undefined,
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
            {translations("listTitle")}
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
            <Field
              icon={Notebook}
              value={mealSearchParams.recipeName ?? ""}
              onChange={setRecipeName}
              placeholder={translations("filters.recipeName")}
            />
          </div>

          <div className="col-span-1">
            <Field
              type="date"
              icon={CalendarArrowDown}
              value={String(mealSearchParams.startDate ?? "")}
              onChange={setStartDate}
              placeholder={translations("filters.startDate")}
            />
          </div>

          <div className="col-span-1">
            <Field
              type="date"
              icon={CalendarArrowUp}
              value={String(mealSearchParams.endDate ?? "")}
              onChange={setEndDate}
              placeholder={translations("filters.endDate")}
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
            {translations("countLabel")} :{" "}
            <span className="text-gray-700 font-bold">{total}</span>
          </div> */}

          <div className="overflow-x-auto overflow-y-auto max-h-[50vh] lg:h-125">
            <table className="w-full min-w-150 table-fixed ">
              <thead className="sticky top-0 z-10 text-sm text-left text-white ">
                <tr>
                  <th className="bg-gray-500 py-2 px-4  border-r border-white/20 rounded-tl-xl">
                    {translations("table.recipeName")}
                  </th>
                  <th className="bg-gray-500 py-2 px-4 border-r border-white/20">
                    {translations("table.nbServing")}
                  </th>
                  <th className="bg-gray-500 py-2 px-4 border-r border-white/20">
                    {translations("table.totalCost")}
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
                      {item.recipeName}
                    </td>
                    <td className="py-2 px-4 border-r border-white/20">
                      {item.meal.nbServing}
                    </td>
                    <td className="py-2 px-4 border-r border-white/20">
                      {formatNumberToCurrency(item.totalCostPrice)}
                    </td>
                    <td className="py-2 px-4 border-r border-white/20">
                      {formatDateFR(item.meal.createdAt || "")}
                    </td>
                    <td className="py-2 px-4 border-r border-white/20">
                      <Beef
                        size={16}
                        className="text-gray-300 hover:text-gray-100 cursor-pointer"
                        onClick={() => {
                          setOpenIngredientsModal(true);
                          setActualMealIngredients(item.mealIngredients);
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
              previousLabel={generalTranslations("actions.previous")}
              nextLabel={generalTranslations("actions.next")}
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
            <h2>{translations("ingredientsList")}</h2>
            <button
              className="flex justify-center items-center cursor-pointer h-6 w-6 border border-custom-sand-dune rounded-full text-custom-sand-dune hover:bg-custom-sand-dune/20"
              onClick={() => setOpenIngredientsModal(false)}
              aria-label={generalTranslations("actions.select")}
            >
              <X size={16} />
            </button>
          </div>

          {actualMealIngredients.length > 0 && (
            <div className="mt-3 space-y-2 pt-4 border-t border-white/20 pb-6 flex flex-col max-h-[40vh] overflow-auto">
              {actualMealIngredients.map((item) => (
                <div
                  key={item.mealIngredientBase.refIngredientStockId}
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
                      {item.ingredientName}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      <span className="text-custom-sand-dune">
                        {formatNumber(item.mealIngredientBase.quantity)}{" "}
                        {item.ingredientUnit}
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
