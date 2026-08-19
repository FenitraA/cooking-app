"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { SquareX, Plus } from "lucide-react";

import { IngredientBase } from "@/lib/ingredient/types";
import { RecipeIngredientBase } from "@/lib/recipe/types";
import GeneralAutocomplete from "@/components/forms/GeneralAutocomplete";
import { formatNumber, getIngredientName } from "@/lib/utils";
import { fetchIngredientByName } from "@/lib/ingredient/api";
import Field from "@/components/forms/Field";

type Props = {
  values: RecipeIngredientBase[];
  onChange: (items: RecipeIngredientBase[]) => void;

  className?: string;
};

export default function IngredientChoice({
  values,
  onChange,

  className,
}: Props) {
  const translations = useTranslations("Ingredient");

  const [error, setError] = useState<string | null>(null);
  const [selectedIngredient, setSelectedIngredient] =
    useState<IngredientBase | null>(null);
  const [quantity, setQuantityPerServing] = useState(0);

  function addItem() {
    if (!selectedIngredient) return;

    if (!quantity || quantity <= 0)
      return setError(translations("errors.required_quantity"));
    const exists = values.some(
      (item) => item.ref_ingredient_id === selectedIngredient.id,
    );

    if (exists) {
      setSelectedIngredient(null);
      return;
    }

    const listItem = {
      id: "",
      insertion_id: "",
      ref_ingredient_id: selectedIngredient.id,
      ingredient_name: selectedIngredient.name,
      ingredient_unit: selectedIngredient.unit,
      ref_recipe_id: "",
      quantity: String(quantity),
    };

    onChange([...values, listItem]);

    setSelectedIngredient(null);
    setQuantityPerServing(0);
  }

  function removeItem(itemToRemove: RecipeIngredientBase) {
    onChange(
      values.filter(
        (item) => item.ref_ingredient_id !== itemToRemove.ref_ingredient_id,
      ),
    );
  }

  return (
    <div className={["relative", className ?? ""].join(" ")}>
      {error && (
        <div className="rounded-lg bg-white/10 px-3 py-2 text-sm text-red-500">
          {error}
        </div>
      )}
      <div className="flex flex-col lg:flex-row lg:items-end justify-center gap-6 mt-1 py-3">
        <GeneralAutocomplete<IngredientBase>
          translationsKey="Ingredient"
          showShadow={false}
          className="col-span-1"
          value={selectedIngredient}
          onSelect={(d) => {
            setSelectedIngredient(d);
          }}
          onClear={() => {
            setSelectedIngredient(null);
          }}
          getName={getIngredientName}
          fetchOptions={fetchIngredientByName}
        />

        <div className="flex flex-row items-end justify-start gap-2">
          <Field
            type="decimal"
            value={String(quantity ?? "")}
            onChange={(v) => setQuantityPerServing(Number(v))}
            placeholder={translations("fields.quantity_per_serving")}
          />
          <div className="bg-white/10 border border-white/20 rounded-lg h-10 w-10 flex items-center justify-center text-gray-300 text-sm">
            {selectedIngredient?.unit}
          </div>
          <button
            type="button"
            onClick={addItem}
            disabled={!selectedIngredient}
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
              key={item.ref_ingredient_id}
              className="flex items-center gap-4 justify-between border-l-4 border-white/20 bg-white/10 p-3 w-full"
            >
              <div
                className="
                  flex
                  flex-col
                  sm:flex-row
                  sm:justify-between
                  gap-2
                  flex-1
                "
              >
                <div className="font-semibold text-gray-300 bg-wh">
                  {item.ingredient_name}
                </div>
                <div className="text-sm text-custom-sand-dune">
                  {formatNumber(item.quantity)}{" "}
                  {item.ingredient_unit}
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeItem(item)}
                className="cursor-pointer"
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
