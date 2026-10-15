"use client";
import Field from "@/components/forms/Field";
import { getErrorMessage, UnauthorizedError } from "@/lib/errors";
import { Button } from "flowbite-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  const generalTranslations = useTranslations("General");
  const [itemToBuy, setItemToBuy] = useState<ItemToBuyBase>({
    id: "",
    name: "",
    description: "",
    estimatedUnitPrice: "0",
    unitsToBuy: "0",
    refIngredientId: null,
    refShoppingItemId: null,
    refItemCategoryId: "",
    refHouseholdId: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
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

    const newErrors: Record<string, string> = {};
    
    if (!itemToBuy.name.trim())
      newErrors.name = translations("errors.requiredName");
    if (!itemToBuy.estimatedUnitPrice || Number(itemToBuy.estimatedUnitPrice) <= 0)
      newErrors.estimatedUnitPrice = translations("errors.requiredEstimatedUnitPrice");
    if (!itemToBuy.unitsToBuy || Number(itemToBuy.unitsToBuy) <= 0)
      newErrors.unitsToBuy = translations("errors.requiredUnitsToBuy");
    if (!itemToBuy.refItemCategoryId.trim())
      newErrors.refItemCategoryId = translations("errors.requiredItemCategory");
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);

    try {
      await createItemToBuy(itemToBuy);

      setSuccess(translations("success.created"));
      setItemToBuy((v) => ({
        ...v,
        id: "",
        name: "",
        description: "",
        estimatedUnitPrice: "0",
        unitsToBuy: "0",
        refIngredientId: null,
        refShoppingItemId: null,
        refItemCategoryId: "",
        refHouseholdId: "",
      }));
      setSelectedIngredient(null);
      setSelectedItemCategory(null);
      onCreated?.();
    } catch (e: unknown) {
      if (e instanceof UnauthorizedError) {
        router.replace("/login");
        return;
      }

      const msg = getErrorMessage(e);
      setError(translations("errors.createFailed", { message: msg }));
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <div className="flex flex-col rounded-xl border w-full mx-auto min-h-full bg-white/10 py-4 px-6 shadow-hard-br space-y-6">
      <header className="relative mb-4 mx-1 flex items-center justify-center rounded-xl border border-custom-sand-dune/30 bg-custom-sand-dune/5 px-6 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight text-custom-sand-dune">
            {translations("createTitle")}
          </h1>
        </div>
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
                estimatedUnitPrice: d.estimatedPrice,
                refIngredientId: d.id,
                refItemCategoryId: ingredientCategory?.id ?? "",
              }));

              setSelectedItemCategory(ingredientCategory);
            }}
            onClear={() => {
              setSelectedIngredient(null);
              setItemToBuy((p) => ({ ...p, refIngredientUnitId: "" }));
            }}
            getName={getIngredientName}
            fetchOptions={fetchIngredientByName}
          />
          <Field
            id="name"
            className="w-full"
            label={translations("fields.name")}
            value={itemToBuy.name}
            onChange={(v) => setItemToBuy((p) => ({ ...p, name: v }))}
            error={errors.name}
            placeholder={translations("fields.name")}
          />
          <Field
            id="description"
            className="w-full"
            label={translations("fields.description")}
            value={itemToBuy.description}
            onChange={(v) => setItemToBuy((p) => ({ ...p, description: v }))}
            error={errors.description}
            placeholder={translations("fields.description")}
          />
          <Field
            id="unitsToBuy"
            className="w-full"
            type="decimal"
            label={translations("fields.unitsToBuy")}
            value={String(itemToBuy.unitsToBuy ?? "")}
            onChange={(v) =>
              setItemToBuy((p) => ({ ...p, unitsToBuy: v }))
            }
            error={errors.unitsToBuy}
            placeholder={translations("fields.unitsToBuy")}
          />
          <Field
            id="estimatedUnitPrice"
            className="w-full"
            type="decimal"
            label={translations("fields.estimatedUnitPrice")}
            value={String(itemToBuy.estimatedUnitPrice ?? "")}
            onChange={(v) =>
              setItemToBuy((p) => ({ ...p, estimatedUnitPrice: v }))
            }
            error={errors.estimatedUnitPrice}
            placeholder={translations("fields.estimatedUnitPrice")}
          />
          <GeneralAutocomplete<ItemCategoryBase>
            label={translations("fields.itemCategory")}
            translationsKey="ItemCategory"
            showShadow={false}
            className="w-full"
            value={selectedItemCategory}
            onSelect={(d) => {
              setSelectedItemCategory(d);
              setItemToBuy((p) => ({ ...p, refItemCategoryId: d.id }));
            }}
            onClear={() => {
              setSelectedItemCategory(null);
              setItemToBuy((p) => ({ ...p, refItemCategoryId: "" }));
            }}
            getName={getItemCategoryName}
            fetchOptions={fetchItemCategories}
            error={errors.refItemCategoryId}
          />
        </div>

        <div className="space-y-3">
          <Button
            type="submit"
            disabled={submitting}
            className="h-10 w-full rounded-lg bg-custom-validation-green px-5 text-sm text-white disabled:bg-white/10 disabled:cursor-not-allowed cursor-pointer hover:bg-custom-validation-green/90"
          >
            {submitting
              ? generalTranslations("actions.saving")
              : generalTranslations("actions.save")}
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
