"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { getErrorMessage, UnauthorizedError } from "@/lib/errors";
import {
  CalendarArrowDown,
  CalendarArrowUp,
  ChevronsLeftRightEllipsis,
  Funnel,
} from "lucide-react";
import FilterField from "@/components/forms/FilterField";
import CustomPagination from "@/components/forms/CustomPagination";
import {
  ShoppingItemRead,
  ShoppingItemSearchParams,
  ShoppingItemSearchResult,
} from "@/lib/shopping/types";
import { fetchShoppingItemSearch } from "@/lib/shopping/api";
import GeneralAutocomplete from "@/components/forms/GeneralAutocomplete";
import { IngredientBase } from "@/lib/ingredient/types";
import {
  formatDateFRNoTime,
  formatNumber,
  formatNumberToCurrency,
  getIngredientName,
} from "@/lib/utils";
import { fetchIngredientByName } from "@/lib/ingredient/api";

export default function ShoppingItemListPage() {
  const router = useRouter();
  const translations = useTranslations("ShoppingItems");
  const general_translations = useTranslations("General");

  const [shoppingItemSearchParams, setShoppingItemSearchParams] =
    useState<ShoppingItemSearchParams>({
      limit: 50,
      offset: 0,
      name: undefined,
      ingredient_id: undefined,
      start_date: undefined,
      end_date: undefined,
    });

  const debouncedSearchParams = useDebounce(shoppingItemSearchParams, 400);

  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shoppingItems, setItemsToBuy] = useState<ShoppingItemRead[]>([]);

  const [selectedIngredient, setSelectedIngredient] =
    useState<IngredientBase | null>(null);

  const pagination = useMemo(() => {
    const perPage = Math.max(1, shoppingItemSearchParams.limit ?? 50);
    const currentPage =
      Math.floor((shoppingItemSearchParams.offset ?? 0) / perPage) + 1;
    const totalPages = Math.max(1, Math.ceil((total ?? 0) / perPage));
    return { currentPage, perPage, totalPages };
  }, [shoppingItemSearchParams.limit, shoppingItemSearchParams.offset, total]);

  function onPageChange(newPage: number) {
    const perPage = Math.max(1, shoppingItemSearchParams.limit ?? 50);
    setShoppingItemSearchParams((p) => ({
      ...p,
      offset: (newPage - 1) * perPage,
    }));
  }

  function setName(v: string) {
    setShoppingItemSearchParams((p) => ({
      ...p,
      name: v || undefined,
      offset: 0,
    }));
  }
  function setStartDate(v: string) {
    setShoppingItemSearchParams((p) => ({
      ...p,
      start_date: v || undefined,
      offset: 0,
    }));
  }
  function setEndDate(v: string) {
    setShoppingItemSearchParams((p) => ({
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

        const data: ShoppingItemSearchResult = await fetchShoppingItemSearch(
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
  }, [router, debouncedSearchParams]);

  // Filter section control
  const [openFilters, setOpenFilters] = useState(false);

  function changeOpenFilter() {
    setOpenFilters((p) => !p);
  }
  const Filters = (
    <div className="flex sm:flex-row flex-col justify-center just gap-4 items-center mb-3 border-b border-custom-sand-dune pb-3">
      <FilterField
        className="w-full sm:max-w-100"
        icon={CalendarArrowDown}
        value={String(shoppingItemSearchParams.name ?? "")}
        onChange={setName}
        placeholder={translations("filters.name")}
      />
      <GeneralAutocomplete<IngredientBase>
        translationsKey="Ingredient"
        showShadow={false}
        className="w-full sm:max-w-100"
        value={selectedIngredient}
        onSelect={(d) => {
          setSelectedIngredient(d);
          setShoppingItemSearchParams((p) => ({
            ...p,
            ingredient_id: d.id,
          }));
        }}
        onClear={() => {
          setSelectedIngredient(null);
          setShoppingItemSearchParams((p) => ({
            ...p,
            ingredient_id: undefined,
          }));
        }}
        getName={getIngredientName}
        fetchOptions={fetchIngredientByName}
      />
      <FilterField
        className="w-full sm:w-auto"
        type="date"
        icon={CalendarArrowDown}
        value={String(shoppingItemSearchParams.start_date ?? "")}
        onChange={setStartDate}
      />
      <ChevronsLeftRightEllipsis
        size={24}
        className="text-custom-sand-dune hidden sm:inline"
      />
      <FilterField
        className="w-full sm:w-auto"
        type="date"
        icon={CalendarArrowUp}
        value={String(shoppingItemSearchParams.end_date ?? "")}
        onChange={setEndDate}
      />
    </div>
  );

  return (
    <div className="rounded-xl bg-white/10 p-6 w-full mx-auto min-h-full">
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

      <div className="flex flex-col space-y-4">
        <div className="hidden lg:block mb-3">{Filters}</div>
        <div
          className={`
            lg:hidden
            overflow-hidden
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

        <div className="relative flex flex-col gap-4 overflow-y-auto h-[60vh] lg:h-150">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-gray-800" />
            </div>
          )}
          {shoppingItems.map((item) => (
            <div
              key={item.shopping_item.id}
              className={`relative flex flex-row items-center w-full min-h-12 px-3 py-1 bg-white/10 border border-white/20 text-gray-300 cursor-pointer`}
            >
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-4 flex-1 w-full">
                <span className="font-semibold text-base sm:text-sm mt-0.5 sm:mt-0 wrap-break-word">
                  <span className="text-custom-sand-dune">
                    {formatDateFRNoTime(item.shopping_date)}
                  </span>{" "}
                  {" - "}
                  {item.shopping_item.name}
                </span>

                {/* Math & Actions Container */}
                <div className="flex flex-row flex-wrap items-center gap-2 sm:gap-4 font-medium text-sm w-full sm:w-auto">
                  {/* Price & Quantity Group */}
                  <div className="flex items-center gap-2">
                    <span className="text-custom-money-green">
                      <span>
                        {formatNumberToCurrency(item.shopping_item.unit_price)}
                      </span>
                    </span>
                    <span className="text-custom-sand-dune">x</span>
                    <span className="text-custom-sand-dune">
                      <span>
                        {formatNumber(item.shopping_item.units_bought)}
                      </span>
                    </span>
                  </div>

                  {/* Total & Action Buttons Group */}
                  <div className="flex items-center justify-between flex-1 sm:flex-initial gap-4">
                    <span className="text-custom-money-green font-semibold flex items-center gap-1.5">
                      <span>=</span>
                      <span>
                        {formatNumberToCurrency(
                          Number(item.shopping_item.units_bought) *
                            Number(item.shopping_item.unit_price),
                        )}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
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
    </div>
  );
}
