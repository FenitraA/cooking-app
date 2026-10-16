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
  const generalTranslations = useTranslations("General");

  const [newIngredientStock, setNewIngredientStock] =
    useState<IngredientStockBase>({
      id: "",
      unitCost: "0",
      quantity: "0",
      refSellerId: "",
      refIngredientId: "",
    });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // const [success, setSuccess] = useState<string | null>(null);

  const [selectedSeller, setSelectedSeller] = useState<SellerBase | null>(null);

  useEffect(() => {
    setNewIngredientStock((v) => ({ ...v, refIngredientId: ingredientId }));
  }, [ingredientId]);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    // setSuccess(null);

    // Verify values (match eng.json keys)
    if (!newIngredientStock.refSellerId.trim())
      return setError(translations("errors.requiredSeller"));
    if (!newIngredientStock.refIngredientId.trim())
      return setError(translations("errors.requiredIngredientId"));
    if (
      !newIngredientStock.quantity ||
      Number(newIngredientStock.quantity) <= 0
    )
      return setError(translations("errors.requiredQuantity"));
    if (
      !newIngredientStock.unitCost ||
      Number(newIngredientStock.unitCost) <= 0
    )
      return setError(translations("errors.requiredUnitCost"));

    setSubmitting(true);

    try {
      await createStock(newIngredientStock);

      // setSuccess(translations("success.created"));
      setNewIngredientStock((v) => ({
        ...v,
        id: "",
        unitCost: "0",
        quantity: "0",
        refSellerId: "",
        refIngredientId: ingredientId,
      }));
      onCreated?.();
    } catch (e: unknown) {
      if (e instanceof UnauthorizedError) {
        router.replace("/login");
        return;
      }

      const msg = getErrorMessage(e);
      setError(translations("errors.createStockFailed", { message: msg }));
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
            setNewIngredientStock((p) => ({ ...p, refSellerId: d.id }));
          }}
          onClear={() => {
            setSelectedSeller(null);
            setNewIngredientStock((p) => ({ ...p, refSellerId: "" }));
          }}
          getName={getSellerName}
          fetchOptions={fetchSellers}
        />
        <Field
          id="quantity"
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
          id="unitCost"
          label={translations("fields.unitCost")}
          type="decimal"
          value={String(newIngredientStock?.unitCost || "")}
          onChange={(v) =>
            setNewIngredientStock({
              ...newIngredientStock,
              unitCost: v,
            })
          }
          placeholder={translations("fields.unitCost")}
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
            ? generalTranslations("actions.saving")
            : translations("actions.saveStock")}
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
