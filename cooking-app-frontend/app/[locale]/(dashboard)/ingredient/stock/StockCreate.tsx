"use client";
import Field from "@/components/forms/Field";
import { getErrorMessage, UnauthorizedError } from "@/lib/errors";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { IngredientStockBase, SellerBase } from "@/lib/ingredient/types";
import { createStock, fetchSellers } from "@/lib/ingredient/api";
import { getSellerName } from "@/lib/utils";
import GeneralAutocomplete from "@/components/forms/GeneralAutocomplete";
import { useEffect, useState } from "react";

export default function IngredientStockCreatePage({
  ingredientId,
  onCreated,
}: {
  ingredientId: string;
  onCreated?: () => void;
}) {
  const router = useRouter();
  const translations = useTranslations("Ingredient");
  const general_translations = useTranslations("General");

  const [newIngredientStock, setNewIngredientStock] =
    useState<IngredientStockBase>({
      id: "",
      unit_cost: "0",
      quantity: "0",
      ref_seller_id: "",
      ref_ingredient_id: "",
    });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // const [success, setSuccess] = useState<string | null>(null);

  const [selectedSeller, setSelectedSeller] = useState<SellerBase | null>(null);

  useEffect(() => {
    setNewIngredientStock((v) => ({ ...v, ref_ingredient_id: ingredientId }));
  }, [ingredientId]);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    // setSuccess(null);

    // Verify values (match eng.json keys)
    if (!newIngredientStock.ref_seller_id.trim())
      return setError(translations("errors.required_seller"));
    if (!newIngredientStock.ref_ingredient_id.trim())
      return setError(translations("errors.required_ingredient_id"));
    if (
      !newIngredientStock.quantity ||
      Number(newIngredientStock.quantity) <= 0
    )
      return setError(translations("errors.required_quantity"));
    if (
      !newIngredientStock.unit_cost ||
      Number(newIngredientStock.unit_cost) <= 0
    )
      return setError(translations("errors.required_unit_cost"));

    setSubmitting(true);

    try {
      await createStock(newIngredientStock);

      // setSuccess(translations("success.created"));
      setNewIngredientStock((v) => ({
        ...v,
        id: "",
        unit_cost: "0",
        quantity: "0",
        ref_seller_id: "",
        ref_ingredient_id: ingredientId,
      }));
      onCreated?.();
    } catch (e: unknown) {
      if (e instanceof UnauthorizedError) {
        router.replace("/login");
        return;
      }

      const msg = getErrorMessage(e);
      setError(translations("errors.create_stock_failed", { message: msg }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-3 sm:p-6">
      <div className="flex flex-col lg:flex-row flex-1 rounded-xl w-full gap-6">
        <GeneralAutocomplete<SellerBase>
          className=""
          label={translations("fields.seller")}
          translationsKey="Ingredient"
          showShadow={false}
          value={selectedSeller}
          onSelect={(d) => {
            setSelectedSeller(d);
            setNewIngredientStock((p) => ({ ...p, ref_seller_id: d.id }));
          }}
          onClear={() => {
            setSelectedSeller(null);
            setNewIngredientStock((p) => ({ ...p, ref_seller_id: "" }));
          }}
          getName={getSellerName}
          fetchOptions={fetchSellers}
        />
        <Field
          label={translations("fields.quantity")}
          type="decimal"
          value={String(newIngredientStock?.quantity || "")}
          onChange={(v) =>
            setNewIngredientStock({
              ...newIngredientStock,
              quantity: v,
            })
          }
          placeholder={translations("fields.quantity")}
        />
        <Field
          label={translations("fields.unit_cost")}
          type="decimal"
          value={String(newIngredientStock?.unit_cost || "")}
          onChange={(v) =>
            setNewIngredientStock({
              ...newIngredientStock,
              unit_cost: v,
            })
          }
          placeholder={translations("fields.unit_cost")}
        />
      </div>
      <div
        className="flex-col
          sm:flex-row-reverse
          items-stretch
          sm:items-center
          justify-between
          gap-2 mt-3 border-t
          border-white/20
          py-3"
      >
        <button
          type="submit"
          disabled={submitting}
          className="h-10 w-full rounded-lg bg-custom-validation-green px-5 text-sm text-white hover:bg-custom-validation-green/90 disabled:opacity-60 cursor-pointer"
        >
          {submitting
            ? general_translations("actions.saving")
            : translations("actions.save_stock")}
        </button>
        {/* {success && (
          <div className="rounded-lg bg-white/10 px-3 py-2 text-sm text-green-500">
            {success}
          </div>
        )} */}

        {error && (
          <div className="rounded-lg bg-white/10 px-3 py-2 text-sm text-red-500">
            {error}
          </div>
        )}
      </div>
    </form>
  );
}
