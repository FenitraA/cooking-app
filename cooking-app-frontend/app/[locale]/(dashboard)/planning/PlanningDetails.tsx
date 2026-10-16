"use client";

import { getErrorMessage, UnauthorizedError } from "@/lib/errors";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

import Field from "@/components/forms/Field";
import { useTranslations } from "next-intl";
import { Button } from "flowbite-react";
import { isPlanningRecipeDirty } from "@/lib/planning/services";
import {
  PlanningRecipeBase,
  PlanningRecipeUpdateData,
} from "@/lib/planning/types";
import { fetchRecipeById, updatePlanningRecipe } from "@/lib/planning/api";
import GeneralAutocomplete from "@/components/forms/GeneralAutocomplete";
import { RecipeBase, RecipeIngredientRead } from "@/lib/recipe/types";
import {
  formatNumber,
  formatNumberToCurrency,
  getRecipeName,
} from "@/lib/utils";
import { fetchRecipeByName } from "@/lib/recipe/api";

export default function PlanningDetails({
  onUpdated,
  planningRecipeId,
}: {
  onUpdated?: () => void;
  planningRecipeId: string;
}) {
  const translations = useTranslations("Planning");
  const generalTranslations = useTranslations("General");
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [initialValues, setInitialValues] = useState<PlanningRecipeBase | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [selectedRecipe, setSelectedRecipe] = useState<RecipeBase | null>(null);

  const [ingredients, setIngredients] = useState<RecipeIngredientRead[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);

  const [planningRecipe, setPlanningRecipe] =
    useState<PlanningRecipeUpdateData>({
      id: "",
      refRecipeId: "",
      planningDate: "",
      nbServing: "0",
      description: "",
    });
  const isDirty = useMemo(() => {
    if (!initialValues) return false;
    return isPlanningRecipeDirty(
      {
        refRecipeId: initialValues?.refRecipeId ?? "",
        planningDate: initialValues?.planningDate ?? "",
        nbServing: initialValues?.nbServing ?? "0",
        description: initialValues?.description ?? "",
      },
      {
        refRecipeId: planningRecipe.refRecipeId,
        planningDate: planningRecipe.planningDate,
        nbServing: planningRecipe.nbServing,
        description: planningRecipe.description,
      },
    );
  }, [
    initialValues,
    planningRecipe.refRecipeId,
    planningRecipe.planningDate,
    planningRecipe.nbServing,
    planningRecipe.description,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const item = await fetchRecipeById(planningRecipeId);
        if (cancelled) return;

        setInitialValues(item.planningRecipe);
        setSelectedRecipe(item.recipe);
        setPlanningRecipe((p) => ({ ...p, ...item.planningRecipe }));
        setTotalPrice(item.estimatedCostPrice);
        setIngredients(item.recipeIngredients);
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

    if (!planningRecipeId) return;
    load();

    return () => {
      cancelled = true;
    };
  }, [router, planningRecipeId]);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!planningRecipe.refRecipeId.trim())
      return setError(translations("errors.requiredRecipe"));
    if (!planningRecipe.planningDate.trim())
      return setError(translations("errors.requiredPlanningDate"));
    if (!planningRecipe.nbServing || Number(planningRecipe.nbServing) <= 0)
      return setError(translations("errors.requiredNbServing"));

    if (!isDirty) return;

    setSubmitting(true);
    try {
      const updatedPlanningRecipe = await updatePlanningRecipe(planningRecipe);
      setInitialValues(updatedPlanningRecipe.planningRecipe);

      setPlanningRecipe((p) => ({
        ...p,
        ...updatedPlanningRecipe.planningRecipe,
      }));

      setSuccess(translations("success.updated"));
      onUpdated?.();
    } catch (e: unknown) {
      if (e instanceof UnauthorizedError) {
        router.replace("/login");
        return;
      }

      const msg = getErrorMessage(e);
      setError(translations("errors.updateFailed", { message: msg }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-row relative rounded-xl h-auto gap-4">
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-xl">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-gray-800" />
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className="flex flex-row flex-wrap gap-4 w-full"
      >
        <div className="flex flex-col space-y-6 min-w-80 border rounded-xl bg-white/10 border-white/20 w-1/4 px-4 flex-1">
          <header className="text-center mb-2 px-2 py-2 border-b border-custom-sand-dune mt-2">
            <h2 className="text-md font-semibold text-custom-sand-dune tracking-tight">
              {translations("fields.description")}
            </h2>
          </header>
          <GeneralAutocomplete<RecipeBase>
            label={translations("fields.chooseRecipe")}
            translationsKey="Recipe"
            showShadow={false}
            className="w-full min-w-50"
            value={selectedRecipe}
            onSelect={(d) => {
              setSelectedRecipe(d);
              setPlanningRecipe((p) => ({
                ...p,
                refRecipeId: d.id,
              }));
            }}
            onClear={() => {
              setSelectedRecipe(null);
              setPlanningRecipe((p) => ({
                ...p,
                refRecipeId: "",
              }));
            }}
            getName={getRecipeName}
            fetchOptions={fetchRecipeByName}
          />
          <Field
            id="nbServing"
            label={translations("fields.nbServing")}
            type="decimal"
            className="w-full min-w-50"
            value={String(planningRecipe.nbServing ?? "")}
            onChange={(v) =>
              setPlanningRecipe((p) => ({
                ...p,
                nbServing: v,
              }))
            }
          />
          <Field
            id="planningDate"
            label={translations("fields.planningDate")}
            type="date"
            className="w-full min-w-50"
            value={planningRecipe.planningDate}
            onChange={(v) =>
              setPlanningRecipe((p) => ({
                ...p,
                planningDate: v,
              }))
            }
          />

          <div className="flex flex-col justify-center gap-2 py-4 w-full border-t border-white/20">
            <Button
              type="submit"
              disabled={submitting || !isDirty}
              className="h-10 rounded-lg bg-custom-validation-green px-5 text-sm text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:bg-custom-validation-green/90"
            >
              {submitting
                ? generalTranslations("actions.saving")
                : generalTranslations("actions.saveChanges")}
            </Button>

            {success && (
              <div className="rounded-lg bg-white/10 px-3 py-2 text-sm text-green-500 w-full">
                {success}
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-white/10 px-3 py-2 text-sm text-red-500 w-full">
                {error}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col space-y-6 min-w-80 border rounded-xl bg-white/10 border-white/20 w-1/3">
          <header className="text-center mb-2 px-2 py-2 border-b border-custom-sand-dune mx-4 mt-2">
            <h2 className="text-md font-semibold text-custom-sand-dune tracking-tight">
              {translations("fields.description")}
            </h2>
          </header>
          <Field
            type="textarea"
            value={planningRecipe.description || ""}
            onChange={(v) =>
              setPlanningRecipe((p) => ({ ...p, description: v }))
            }
            className="h-130 mx-4 py-3"
          />
        </div>
        <div className="flex flex-col space-y-6 min-w-80 border rounded-xl bg-white/10 border-white/20 w-1/3">
          <header className="text-center px-2 mb-2 py-2 border-b border-custom-sand-dune mx-4 mt-2">
            <h2 className="text-md font-semibold text-custom-sand-dune tracking-tight">
              {translations("fields.ingredients")}
            </h2>
          </header>
          <div className="flex-1 px-4 pt-3">
            {ingredients.map((item) => (
              <div
                key={item.recipeIngredientBase.refIngredientId}
                className="flex items-center gap-4 justify-between border-l-4 border-white/20 bg-white/10 px-3 h-10 w-full"
              >
                <div className="flex flex-row items-center justify-between gap-6 w-2/3 h-full">
                  <div className="text-sm text-gray-300 bg-wh">
                    {item.ingredientName} :
                  </div>
                  <div className="text-sm text-gray-300">
                    {formatNumber(
                      Number(item.recipeIngredientBase.quantity) *
                        Number(planningRecipe.nbServing),
                    )}{" "}
                    {item.ingredientUnit}
                  </div>
                </div>
                <div className="flex flex-row items-center justify-end gap-6 w-1/3 h-full font-semibold text-sm text-custom-money-green">
                  💰{" "}
                  {formatNumberToCurrency(
                    item.estimatedCostPerUnit *
                      Number(item.recipeIngredientBase.quantity) *
                      Number(planningRecipe.nbServing),
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-row-reverse font-semibold border-t border-white/20 py-2 text-custom-money-green w-5/6 mx-auto">
            💰 {formatNumberToCurrency(totalPrice)}
          </div>
        </div>
      </form>
    </div>
  );
}
