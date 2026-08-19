"use client";
import Field from "@/components/forms/Field";
import { getErrorMessage, UnauthorizedError } from "@/lib/errors";
import { Button } from "flowbite-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import GeneralAutocomplete from "@/components/forms/GeneralAutocomplete";
import { ItemCategoryBase, ItemToBuyBase } from "@/lib/shopping/types";
import { IngredientBase } from "@/lib/ingredient/types";
import {
  createItemToBuy,
  fetchIngredientItemCategory,
  fetchItemCategories,
} from "@/lib/shopping/api";
import { getIngredientName, getItemCategoryName } from "@/lib/utils";
import { fetchIngredientByName } from "@/lib/ingredient/api";

export default function ItemToBuyCreatePage({
  onCreated,
}: {
  onCreated?: () => void;
}) {
  const router = useRouter();
  const translations = useTranslations("ItemToBuy");
  const general_translations = useTranslations("General");
  const [itemToBuy, setItemToBuy] = useState<ItemToBuyBase>({
    id: "",
    name: "",
    description: "",
    estimated_unit_price: "0",
    units_to_buy: "0",
    ref_ingredient_id: null,
    ref_shopping_item_id: null,
    ref_item_category_id: "",
    ref_household_id: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [selectedItemCategory, setSelectedItemCategory] =
    useState<ItemCategoryBase | null>(null);

  const [selectedIngredient, setSelectedIngredient] =
    useState<IngredientBase | null>(null);
  const [ingredientCategory, setIngredientCategory] =
    useState<ItemCategoryBase | null>(null);

  useEffect(() => {
    const loadIngredientCategory = async () => {
      try {
        const category = await fetchIngredientItemCategory();
        setIngredientCategory(category);
      } catch (err) {
        console.error(err);
      }
    };

    loadIngredientCategory();
  }, []);
  
  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!itemToBuy.name.trim())
      return setError(translations("errors.required_name"));
    if (!itemToBuy.estimated_unit_price || Number(itemToBuy.estimated_unit_price) <= 0)
      return setError(translations("errors.required_estimated_unit_price"));
    if (!itemToBuy.units_to_buy || Number(itemToBuy.units_to_buy) <= 0)
      return setError(translations("errors.required_units_to_buy"));
    if (!itemToBuy.ref_item_category_id.trim())
      return setError(translations("errors.required_item_category"));

    setSubmitting(true);

    try {
      await createItemToBuy(itemToBuy);

      setSuccess(translations("success.created"));
      setItemToBuy((v) => ({
        ...v,
        id: "",
        name: "",
        description: "",
        estimated_unit_price: "0",
        units_to_buy: "0",
        ref_ingredient_id: null,
        ref_shopping_item_id: null,
        ref_item_category_id: "",
        ref_household_id: "",
      }));
      setSelectedIngredient(null);
      onCreated?.();
    } catch (e: unknown) {
      if (e instanceof UnauthorizedError) {
        router.replace("/login");
        return;
      }

      const msg = getErrorMessage(e);
      setError(translations("errors.create_failed", { message: msg }));
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <div className="flex flex-col rounded-xl border w-full mx-auto min-h-full bg-white/10 py-4 px-6 shadow-hard-br space-y-6">
      <header className="text-center mb-3 px-6 py-2 border-b-2 border-custom-sand-dune">
        <h1 className="text-xl font-semibold text-custom-sand-dune tracking-tight">
          {translations("create_title")}
        </h1>
      </header>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col flex-1 justify-between h-full space-y-6"
      >
        <div className="flex flex-row justify-left gap-6 items-end flex-wrap">
          <GeneralAutocomplete<IngredientBase>
            label={translations("fields.ingredient")}
            translationsKey="Ingredient"
            showShadow={false}
            className="w-full"
            value={selectedIngredient}
            onSelect={(d) => {
              setSelectedIngredient(d);

              setItemToBuy((p) => ({
                ...p,
                name: d.name,
                estimated_unit_price: d.estimated_price,
                ref_ingredient_id: d.id,
                ref_item_category_id: ingredientCategory?.id ?? "",
              }));

              setSelectedItemCategory(ingredientCategory);
            }}
            onClear={() => {
              setSelectedIngredient(null);
              setItemToBuy((p) => ({ ...p, ref_ingredient_unit_id: "" }));
            }}
            getName={getIngredientName}
            fetchOptions={fetchIngredientByName}
          />
          <Field
            className="w-full"
            label={translations("fields.name")}
            value={itemToBuy.name}
            onChange={(v) => setItemToBuy((p) => ({ ...p, name: v }))}
            placeholder={translations("fields.name")}
          />
          <Field
            className="w-full"
            label={translations("fields.description")}
            value={itemToBuy.description}
            onChange={(v) => setItemToBuy((p) => ({ ...p, description: v }))}
            placeholder={translations("fields.description")}
          />
          <Field
            className="w-full"
            type="decimal"
            label={translations("fields.units_to_buy")}
            value={String(itemToBuy.units_to_buy ?? "")}
            onChange={(v) =>
              setItemToBuy((p) => ({ ...p, units_to_buy: v }))
            }
            placeholder={translations("fields.units_to_buy")}
          />
          <Field
            className="w-full"
            type="decimal"
            label={translations("fields.estimated_unit_price")}
            value={String(itemToBuy.estimated_unit_price ?? "")}
            onChange={(v) =>
              setItemToBuy((p) => ({ ...p, estimated_unit_price: v }))
            }
            placeholder={translations("fields.estimated_unit_price")}
          />
          <GeneralAutocomplete<ItemCategoryBase>
            label={translations("fields.item_category")}
            translationsKey="ItemCategory"
            showShadow={false}
            className="w-full"
            value={selectedItemCategory}
            onSelect={(d) => {
              setSelectedItemCategory(d);
              setItemToBuy((p) => ({ ...p, ref_item_category_id: d.id }));
            }}
            onClear={() => {
              setSelectedItemCategory(null);
              setItemToBuy((p) => ({ ...p, ref_item_category_id: "" }));
            }}
            getName={getItemCategoryName}
            fetchOptions={fetchItemCategories}
          />
        </div>

        <div className="space-y-3">
          <Button
            type="submit"
            disabled={submitting}
            className="h-10 w-full rounded-lg bg-custom-validation-green px-5 text-sm text-white disabled:bg-white/10 disabled:cursor-not-allowed cursor-pointer hover:bg-custom-validation-green/90"
          >
            {submitting
              ? general_translations("actions.saving")
              : general_translations("actions.save")}
          </Button>

          {success && (
            <div className="rounded-lg bg-white/10 px-3 py-2 text-sm text-green-500">
              {success}
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-white/10 px-3 py-2 text-sm text-red-500">
              {error}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
