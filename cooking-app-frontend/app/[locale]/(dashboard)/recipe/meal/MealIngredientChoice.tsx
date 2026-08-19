"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { SquareX, Plus } from "lucide-react";

import { IngredientBase, IngredientStockRead } from "@/lib/ingredient/types";
import { MealIngredientBase } from "@/lib/recipe/types";
import GeneralAutocomplete from "@/components/forms/GeneralAutocomplete";
import {
  formatNumber,
  formatNumberToCurrency,
  getIngredientName,
  getIngredientStockName,
  getIngredientStockNameSimple,
} from "@/lib/utils";
import {
  fetchIngredientByName,
  fetchIngredientStocks,
} from "@/lib/ingredient/api";
import Field from "@/components/forms/Field";
import GeneralSelect from "@/components/forms/GeneralSelect";

type Props = {
  values: MealIngredientBase[];
  onChange: (items: MealIngredientBase[]) => void;

  className?: string;
};

export default function MealIngredientChoice({
  values,
  onChange,

  className,
}: Props) {
  const translations = useTranslations("Ingredient");

  const [error, setError] = useState<string | null>(null);
  const [selectedIngredient, setSelectedIngredient] =
    useState<IngredientBase | null>(null);
  const [selectedIngredientStock, setSelectedIngredientStock] =
    useState<IngredientStockRead | null>(null);
  const [quantityUsed, setQuantityUsed] = useState(0);

  function addItem() {
    setError(null);
    if (!selectedIngredientStock) return;

    if (!quantityUsed || quantityUsed <= 0)
      return setError(translations("errors.required_quantity"));
    if (quantityUsed > selectedIngredientStock.quantity_left)
      return setError(translations("errors.not_enough_stock"));
    const exists = values.some(
      (item) =>
        item.ref_ingredient_stock_id ===
        selectedIngredientStock.ingredient_stock.id,
    );

    if (exists) {
      setSelectedIngredientStock(null);
      return;
    }

    const listItem = {
      id: "",
      ref_meal_id: "",
      ref_ingredient_unit_id: "",
      ref_ingredient_stock_id: selectedIngredientStock.ingredient_stock.id,
      ingredient_name: selectedIngredientStock.ingredient_name,
      ingredient_unit: selectedIngredientStock.ingredient_unit,
      total_price:
        String(quantityUsed * Number(selectedIngredientStock.ingredient_stock.unit_cost)),
      stock_description: getIngredientStockNameSimple(selectedIngredientStock), // optional, only for reads
      quantity: String(quantityUsed),
    };

    onChange([...values, listItem]);

    setSelectedIngredientStock(null);
    setQuantityUsed(0);
  }

  function removeItem(itemToRemove: MealIngredientBase) {
    onChange(
      values.filter(
        (item) =>
          item.ref_ingredient_stock_id !== itemToRemove.ref_ingredient_stock_id,
      ),
    );
  }

  return (
    <div className={["relative", className ?? ""].join(" ")}>
      {error && (
        <div className="rounded-lg bg-white/10 py-2 text-sm text-red-500">
          {error}
        </div>
      )}
      <div className="flex flex-row flex-wrap items-end gap-6 mt-1 py-3">
        <GeneralAutocomplete<IngredientBase>
          translationsKey="Ingredient"
          showShadow={false}
          className="min-w-60"
          value={selectedIngredient}
          onSelect={(d) => {
            setSelectedIngredient(d);
          }}
          onClear={() => {
            setSelectedIngredient(null);
            setSelectedIngredientStock(null);
          }}
          getName={getIngredientName}
          fetchOptions={fetchIngredientByName}
        />
        <GeneralSelect<IngredientStockRead>
          translationsKey="IngredientStock"
          showShadow={false}
          className="min-w-60"
          idParameter={selectedIngredient?.id}
          value={selectedIngredientStock}
          onSelect={(d) => {
            setSelectedIngredientStock(d);
          }}
          onClear={() => {
            setSelectedIngredientStock(null);
          }}
          getName={getIngredientStockName}
          fetchOptions={fetchIngredientStocks}
        />
        <div className="flex flex-row items-end gap-2">
          <Field
            type="decimal"
            className="w-20"
            value={String(quantityUsed ?? "")}
            onChange={(v) => setQuantityUsed(Number(v) || 0)}
            placeholder={translations("fields.quantity_per_serving")}
          />
          <div className="bg-white/10 border border-white/20 rounded-lg h-10 w-10 flex items-center justify-center text-gray-300 text-sm">
            {selectedIngredient?.unit}
          </div>
          <button
            type="button"
            onClick={addItem}
            disabled={!selectedIngredientStock}
            className="h-10 px-3 rounded-lg bg-custom-validation-green text-white disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed hover:bg-custom-validation-green/90"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {values.length > 0 && (
        <div className="mt-3 space-y-2 pt-4 border-t border-white/20 pb-6 flex flex-col max-h-[40vh] overflow-auto">
          {values.map((item) => (
            <div
              key={item.ref_ingredient_stock_id}
              className="
          flex
          items-center
          gap-4
          justify-between
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
                    {formatNumber(item.quantity)} {item.ingredient_unit}
                  </span>

                  <span className="text-gray-400">
                    Stock: {item.stock_description}
                  </span>

                  <span className="font-semibold text-custom-money-green">
                    {formatNumberToCurrency(item.total_price ?? 0)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeItem(item)}
                className="shrink-0 cursor-pointer"
              >
                <SquareX
                  size={18}
                  className="text-custom-button-red hover:text-red-300"
                />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
