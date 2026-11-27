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
import Field from "@/components/forms/Field";
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
  const generalTranslations = useTranslations("General");

  const [shoppingItemSearchParams, setShoppingItemSearchParams] =
    useState<ShoppingItemSearchParams>({
      limit: 50,
      offset: 0,
      name: undefined,
      ingredientId: undefined,
      startDate: undefined,
      endDate: undefined,
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
      startDate: v || undefined,
      offset: 0,
    }));
  }
  function setEndDate(v: string) {
    setShoppingItemSearchParams((p) => ({
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
      <Field
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
            ingredientId: d.id,
          }));
        }}
        onClear={() => {
          setSelectedIngredient(null);
          setShoppingItemSearchParams((p) => ({
            ...p,
            ingredientId: undefined,
          }));
        }}
        getName={getIngredientName}
        fetchOptions={fetchIngredientByName}
      />
      <Field
        className="w-full sm:w-auto"
        type="date"
        icon={CalendarArrowDown}
        value={String(shoppingItemSearchParams.startDate ?? "")}
        onChange={setStartDate}
      />
      <ChevronsLeftRightEllipsis
        size={24}
        className="text-custom-sand-dune hidden sm:inline"
      />
      <Field
        className="w-full sm:w-auto"
        type="date"
        icon={CalendarArrowUp}
        value={String(shoppingItemSearchParams.endDate ?? "")}
        onChange={setEndDate}
      />
    </div>
  );

  return (
    <div className="rounded-xl bg-white/10 p-6 w-full mx-auto min-h-full">
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

        <div className="relative flex flex-col gap-4 overflow-y-auto h-[60vh] lg:h-150">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-gray-800" />
            </div>
          )}
          {shoppingItems.map((item) => (
            <div
              key={item.shoppingItem.id}
              className={`
                  group relative rounded-xl border px-3 py-2.5
                  transition-all duration-200
                  border-white/10 bg-white/5 hover:border-custom-sand-dune/30 hover:bg-white/8
                `}
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-5">
                
                <div className="flex pl-5 items-center gap-2.5 min-w-0 lg:flex-1">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm text-gray-100 truncate">
                      {item.shoppingItem.name}
                    </h3>
                    <p className="text-sm font-bold text-gray-500">
                      {formatDateFRNoTime(item.shoppingDate)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 lg:gap-5 lg:w-auto lg:flex lg:items-center">
                  {/* Price Group */}
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase tracking-wider text-gray-500 mb-1">
                      Unit price
                    </p>

                    <p className="font-semibold text-xs text-custom-money-green truncate">
                      {formatNumberToCurrency(item.shoppingItem.unitPrice)}
                    </p>
                  </div>
                  {/* Quantity Group */}
                  <div className="min-w-0 lg:w-28">
                    <p className="text-[9px] uppercase tracking-wider text-gray-500 mb-1">
                      Quantity
                    </p>

                    <p className="font-semibold text-xs text-gray-200 truncate">
                      {formatNumber(item.shoppingItem.unitsBought)}{" "}
                      {item.ingredientUnit ?? "pc"}
                    </p>
                  </div>
                  {/* Total */}
                  <div className="min-w-0 lg:w-32">
                    <p className="text-[9px] uppercase tracking-wider text-gray-500 mb-1">
                      Total
                    </p>

                    <p className="font-bold text-sm text-custom-money-green truncate">
                      {formatNumberToCurrency(
                        Number(item.shoppingItem.unitsBought) *
                          Number(item.shoppingItem.unitPrice),
                      )}
                    </p>
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
              previousLabel={generalTranslations("actions.previous")}
              nextLabel={generalTranslations("actions.next")}
              showIcons
            />
          </div>
        </div>
      </div>
    </div>
  );
}
