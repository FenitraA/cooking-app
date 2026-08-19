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
  RefreshCcw,
  X,
} from "lucide-react";
import FilterField from "@/components/forms/FilterField";
import CustomPagination from "@/components/forms/CustomPagination";
import { fetchMealSearch } from "@/lib/recipe/api";
import { formatDateFR, formatNumberToCurrency } from "@/lib/utils";
import {
  ShoppingRead,
  ShoppingSearchParams,
  ShoppingSearchResult,
} from "@/lib/shopping/types";
import { fetchShoppingSearch } from "@/lib/shopping/api";
import ShoppingCard from "./ShoppingCard";

export default function ShoppingHistoryPage() {
  const router = useRouter();
  const translations = useTranslations("Shopping");
  const general_translations = useTranslations("General");

  const [shoppingSearchParams, setShoppingSearchParams] =
    useState<ShoppingSearchParams>({
      limit: 50,
      offset: 0,
      start_date: undefined,
      end_date: undefined,
    });

  const debouncedSearchParams = useDebounce(shoppingSearchParams, 400);

  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shoppings, setShoppings] = useState<ShoppingRead[]>([]);

  const pagination = useMemo(() => {
    const perPage = Math.max(1, shoppingSearchParams.limit ?? 50);
    const currentPage =
      Math.floor((shoppingSearchParams.offset ?? 0) / perPage) + 1;
    const totalPages = Math.max(1, Math.ceil((total ?? 0) / perPage));
    return { currentPage, perPage, totalPages };
  }, [shoppingSearchParams.limit, shoppingSearchParams.offset, total]);

  function onPageChange(newPage: number) {
    const perPage = Math.max(1, shoppingSearchParams.limit ?? 50);
    setShoppingSearchParams((p) => ({
      ...p,
      offset: (newPage - 1) * perPage,
    }));
  }

  function setStartDate(v: string) {
    setShoppingSearchParams((p) => ({
      ...p,
      start_date: v || undefined,
      offset: 0,
    }));
  }
  function setEndDate(v: string) {
    setShoppingSearchParams((p) => ({
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

        const data: ShoppingSearchResult = await fetchShoppingSearch(
          debouncedSearchParams,
        );

        setTotal(data.total);
        setShoppings(data.items);
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

  return (
    <div className="rounded-xl bg-white/10 p-6 w-full mx-auto min-h-full">
      <header className="text-center mb-4 px-2 py-2 border-b border-custom-sand-dune mx-4 mt-2">
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

        <div className="flex sm:flex-row flex-col justify-center items-center sm:grid-cols-3 gap-4 mb-3 px-2">
          <FilterField
            className="w-full sm:w-auto"
            type="date"
            icon={CalendarArrowDown}
            value={String(shoppingSearchParams.start_date ?? "")}
            onChange={setStartDate}
            placeholder={translations("filters.start_date")}
          />
          <ChevronsLeftRightEllipsis
            size={24}
            className="text-custom-sand-dune hidden sm:inline"
          />
          <FilterField
            className="w-full sm:w-auto"
            type="date"
            icon={CalendarArrowUp}
            value={String(shoppingSearchParams.end_date ?? "")}
            onChange={setEndDate}
            placeholder={translations("filters.end_date")}
          />
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto h-[60vh] lg:h-150">
          {shoppings.map((item) => (
            <div
              key={item.shopping.id}
              className="relative rounded-xl w-full sm:px-3"
            >
              <ShoppingCard data={item} />
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
