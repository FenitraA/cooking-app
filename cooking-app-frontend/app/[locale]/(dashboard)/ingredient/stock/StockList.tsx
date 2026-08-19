"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getErrorMessage, UnauthorizedError } from "@/lib/errors";
import {
  deleteIngredientStock,
  fetchIngredientStocks,
} from "@/lib/ingredient/api";
import { IngredientStockRead } from "@/lib/ingredient/types";
import { formatNumber, formatNumberToCurrency } from "@/lib/utils";
import { RefreshCcw, X } from "lucide-react";
import DeleteConfirmModal from "@/components/forms/DeleteConfirmationModal";

export default function IngredientStockListPage({
  ingredientId,
  refreshKey,
  refreshTrigger,
}: {
  ingredientId: string;
  refreshKey: number;
  refreshTrigger?: () => void;
}) {
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [stockIdToDelete, setStockIdToDelete] = useState("");

  const router = useRouter();
  const translations = useTranslations("Ingredient");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [ingredientStocks, setIngredientStocks] = useState<
    IngredientStockRead[]
  >([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const data: IngredientStockRead[] =
          await fetchIngredientStocks(ingredientId);
        setIngredientStocks(data);
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
  }, [router, ingredientId, refreshKey]);

  async function handleDeleteStock() {
    setDeleteLoading(true);
    try {
      await deleteIngredientStock({ ingredient_stock_id: stockIdToDelete });
      refreshTrigger?.();
    } finally {
      setDeleteLoading(false);
      setOpenDeleteModal(false);
    }
  }

  return (
    <div className="rounded-xl w-full mx-auto min-h-full py-4 px-2 sm:px-6 space-y-6">
      <div className="flex flex-col h-full">
        {error && (
          <div className="mb-3 rounded-xl bg-white/10 px-3 py-2 text-sm text-red-500">
            {error}
          </div>
        )}

        <div className="relative flex-1 p-2 rounded-xl mb-3">
          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-xl">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-gray-800" />
            </div>
          )}

          {/* <div className="text-xs text-gray-400 ml-2 mb-2">
            {translations("count_label")} :{" "}
            <span className="text-gray-700 font-bold">{total}</span>
          </div> */}

          <div className="overflow-x-scroll overflow-y-scroll max-h-[50vh] lg:h-125">
            <table className="w-full min-w-150 table-fixed">
              <thead className="sticky top-0 z-10 text-sm text-left text-white ">
                <tr>
                  <th className="bg-white/10 py-2 px-4  border-r border-white/20 rounded-tl-xl">
                    {translations("table.seller")}
                  </th>
                  <th className="bg-white/10 py-2 px-4 border-r border-white/20">
                    {translations("table.quantity_left")}
                  </th>
                  <th className="bg-white/10 py-2 px-4 border-r border-white/20">
                    {translations("table.unit_cost")}
                  </th>
                  <th
                    className="bg-white/10 py-2 pl-4 pr-8 w-10 rounded-tr-xl cursor-pointer"
                    onClick={() => {
                      refreshTrigger?.();
                    }}
                  >
                    <RefreshCcw size={16} />
                  </th>
                </tr>
              </thead>

              <tbody>
                {ingredientStocks.map((item) => (
                  <tr
                    key={item.ingredient_stock.id}
                    className="text-gray-300 text-sm border-b border-white/20"
                  >
                    <td className="py-2 px-4 border-x border-white/20">
                      {item.seller_name}
                    </td>
                    <td className="py-2 px-4 border-r border-white/20">
                      {formatNumber(Number(item.quantity_left))}{" "}
                      {item.ingredient_unit}
                    </td>
                    <td className="py-2 px-4 border-r border-white/20">
                      {formatNumberToCurrency(item.ingredient_stock.unit_cost)}
                    </td>
                    <td className="py-2 px-4 border-r border-white/20">
                      <X
                        size={16}
                        className="text-red-500 hover:text-red-700 cursor-pointer"
                        onClick={() => {
                          setOpenDeleteModal(true);
                          setStockIdToDelete(item.ingredient_stock.id);
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <DeleteConfirmModal
        open={openDeleteModal}
        onCancel={() => setOpenDeleteModal(false)}
        onConfirm={handleDeleteStock}
        loading={deleteLoading}
      />
    </div>
  );
}
