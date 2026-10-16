"use client";

import CustomAccordion from "@/components/forms/CustomAccordion";
import { ShoppingRead } from "@/lib/shopping/types";
import {
  formatDateFRNoTime,
  formatNumber,
  formatNumberToCurrency,
} from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export type RecipeCardProps = {
  data: ShoppingRead;
};

export default function RecipeCard({ data }: RecipeCardProps) {
  const router = useRouter();

  const translations = useTranslations("Shopping");

  return (
    <CustomAccordion
      title={
        <div className="flex w-full flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex flex-1 flex-col text-left">
            <div className="flex flex-row gap-3 justify-between sm:justify-start items-center">
              <span className="text-lg font-bold text-custom-sand-dune">
                {formatDateFRNoTime(data.shopping.shoppingDate)}
              </span>
            </div>

            <span className="text-sm text-white/70">
              {data.shoppingItems.length} {translations("items")}
            </span>

            <div className="mt-2 flex flex-wrap gap-3 text-sm">
              <span className="text-custom-money-green font-semibold">
                💰 {formatNumberToCurrency(data.totalCost)}
              </span>
            </div>
          </div>
        </div>
      }
    >
      <div className="flex flex-col lg:flex-row gap-6 text-gray-300">
        {/* Items */}
        <div className="w-full">
          <header className="mb-2 px-2 py-2 border-b border-custom-sand-dune">
            <h2 className="text-md font-semibold text-custom-sand-dune tracking-tight">
              {translations("items")}
            </h2>
          </header>

          <div className="space-y-2">
            {data.shoppingItems.map((item) => (
              <div
                key={item.shoppingItem.id}
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
                <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-4 flex-1 w-full">
                  <span className="font-semibold text-base sm:text-sm mt-0.5 sm:mt-0 wrap-break-word">
                    {item.shoppingItem.name}
                  </span>

                  {/* Math & Actions Container */}
                  <div className="flex flex-row flex-wrap items-center gap-2 sm:gap-4 font-medium text-sm w-full sm:w-auto">
                    {/* Price & Quantity Group */}
                    <div className="flex items-center gap-2">
                      <span className="text-custom-money-green">
                        <span>
                          {formatNumberToCurrency(
                            item.shoppingItem.unitPrice,
                          )}
                        </span>
                      </span>
                      <span className="text-custom-sand-dune">x</span>
                      <span className="text-custom-sand-dune">
                        <span>
                          {formatNumber(item.shoppingItem.unitsBought)}
                        </span>
                      </span>
                    </div>

                    {/* Total & Action Buttons Group */}
                    <div className="flex items-center justify-between flex-1 sm:flex-initial gap-4">
                      <span className="text-custom-money-green font-semibold flex items-center gap-1.5">
                        <span>=</span>
                        <span>
                          {formatNumberToCurrency(
                            Number(item.shoppingItem.unitsBought) *
                              Number(item.shoppingItem.unitPrice),
                          )}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CustomAccordion>
  );
}
