"use client";

import CustomAccordion from "@/components/forms/CustomAccordion";
import { ShoppingRead } from "@/lib/shopping/types";
import { formatDateFRNoTime, formatNumber, formatNumberToCurrency } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export type RecipeCardProps = {
  data: ShoppingRead;
};

export default function RecipeCard({ data }: RecipeCardProps) {
  const router = useRouter();

  const translations = useTranslations("Shopping");

  useEffect(() => {
    console.log("RecipeCard data:", data);
  }, [data]);
  return (
    <CustomAccordion
      title={
        <div className="flex w-full flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex flex-1 flex-col text-left">
            <div className="flex flex-row gap-3 justify-between sm:justify-start items-center">
              <span className="text-lg font-bold text-custom-sand-dune">
                {formatDateFRNoTime(data.shopping.shopping_date)}
              </span>
            </div>

            <span className="text-sm text-white/70">
              {data.shopping_items.length} {translations("items")}
            </span>

            <div className="mt-2 flex flex-wrap gap-3 text-sm">
              <span className="text-custom-money-green font-semibold">
                💰 {formatNumberToCurrency(data.total_cost)}
              </span>
            </div>
          </div>
        </div>
      }
    >
      <div className="flex flex-col lg:flex-row gap-6 text-gray-300">
        {/* Items */}
        <div className="w-full lg:w-1/2">
          <header className="mb-2 px-2 py-2 border-b border-custom-sand-dune">
            <h2 className="text-md font-semibold text-custom-sand-dune tracking-tight">
              {translations("items")}
            </h2>
          </header>

          <div className="space-y-2">
            {data.shopping_items.map((item) => (
              <div
                key={item.shopping_item.id}
                className="
                  flex
                  bg-white/10
                  flex-col
                  p-3
                  sm:flex-row
                  sm:justify-between
                  gap-2
                  flex-1
                "
              >
                <div className="flex flex-col sm:flex-row sm:justify-between gap-2 flex-1 items-center">
                  <span className="font-semibold">
                    {item.shopping_item.name}
                  </span>

                  <span className="font-medium text-sm">
                    <span className="text-custom-sand-dune pr-4">
                      x {formatNumber(item.shopping_item.units_bought)}
                    </span>
                    <span className="ml-2 text-custom-money-green font-semibold">
                      {formatNumberToCurrency(
                        Number(item.shopping_item.units_bought) *
                          Number(item.shopping_item.unit_price),
                      )}
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CustomAccordion>
  );
}
