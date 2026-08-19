"use client";

import { getErrorMessage, UnauthorizedError } from "@/lib/errors";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

import Field from "@/components/forms/Field";
import { useTranslations } from "next-intl";
import { Button } from "flowbite-react";
import TextAreaField from "@/components/forms/TextAreaField";
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
  const general_translations = useTranslations("General");
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
      ref_recipe_id: "",
      planning_date: "",
      nb_serving: "0",
      description: "",
    });
  const isDirty = useMemo(() => {
    if (!initialValues) return false;
    return isPlanningRecipeDirty(
      {
        ref_recipe_id: initialValues?.ref_recipe_id ?? "",
        planning_date: initialValues?.planning_date ?? "",
        nb_serving: initialValues?.nb_serving ?? "0",
        description: initialValues?.description ?? "",
      },
      {
        ref_recipe_id: planningRecipe.ref_recipe_id,
        planning_date: planningRecipe.planning_date,
        nb_serving: planningRecipe.nb_serving,
        description: planningRecipe.description,
      },
    );
  }, [
    initialValues,
    planningRecipe.ref_recipe_id,
    planningRecipe.planning_date,
    planningRecipe.nb_serving,
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

        setInitialValues(item.planning_recipe);
        setSelectedRecipe(item.recipe);
        setPlanningRecipe((p) => ({ ...p, ...item.planning_recipe }));
        setTotalPrice(item.estimated_cost_price)
        setIngredients(item.recipe_ingredients);
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

    if (!planningRecipe.ref_recipe_id.trim())
      return setError(translations("errors.required_recipe"));
    if (!planningRecipe.planning_date.trim())
      return setError(translations("errors.required_planning_date"));
    if (!planningRecipe.nb_serving || Number(planningRecipe.nb_serving) <= 0)
      return setError(translations("errors.required_nb_serving"));

    if (!isDirty) return;

    setSubmitting(true);
    try {
      const updatedPlanningRecipe = await updatePlanningRecipe(planningRecipe);
      setInitialValues(updatedPlanningRecipe.planning_recipe);

      setPlanningRecipe((p) => ({
        ...p,
        ...updatedPlanningRecipe.planning_recipe,
      }));

      setSuccess(translations("success.updated"));
      onUpdated?.();
    } catch (e: unknown) {
      if (e instanceof UnauthorizedError) {
        router.replace("/login");
        return;
      }

      const msg = getErrorMessage(e);
      setError(translations("errors.update_failed", { message: msg }));
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
            label={translations("fields.choose_recipe")}
            translationsKey="Recipe"
            showShadow={false}
            className="w-full min-w-50"
            value={selectedRecipe}
            onSelect={(d) => {
              setSelectedRecipe(d);
              setPlanningRecipe((p) => ({
                ...p,
                ref_recipe_id: d.id,
              }));
            }}
            onClear={() => {
              setSelectedRecipe(null);
              setPlanningRecipe((p) => ({
                ...p,
                ref_recipe_id: "",
              }));
            }}
            getName={getRecipeName}
            fetchOptions={fetchRecipeByName}
          />
          <Field
            label={translations("fields.nb_serving")}
            type="decimal"
            className="w-full min-w-50"
            value={String(planningRecipe.nb_serving ?? "")}
            onChange={(v) =>
              setPlanningRecipe((p) => ({
                ...p,
                nb_serving: v,
              }))
            }
          />
          <Field
            label={translations("fields.planning_date")}
            type="date"
            className="w-full min-w-50"
            value={planningRecipe.planning_date}
            onChange={(v) =>
              setPlanningRecipe((p) => ({
                ...p,
                planning_date: v,
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
                ? general_translations("actions.saving")
                : general_translations("actions.save_changes")}
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
          <TextAreaField
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
                key={item.recipe_ingredient_base.ref_ingredient_id}
                className="flex items-center gap-4 justify-between border-l-4 border-white/20 bg-white/10 px-3 h-10 w-full"
              >
                <div className="flex flex-row items-center justify-between gap-6 w-2/3 h-full">
                  <div className="text-sm text-gray-300 bg-wh">
                    {item.ingredient_name} :
                  </div>
                  <div className="text-sm text-gray-300">
                    {formatNumber(
                      Number(item.recipe_ingredient_base.quantity) *
                        Number(planningRecipe.nb_serving),
                    )}{" "}
                    {item.ingredient_unit}
                  </div>
                </div>
                <div className="flex flex-row items-center justify-end gap-6 w-1/3 h-full font-semibold text-sm text-custom-money-green">
                  💰{" "}
                  {formatNumberToCurrency(
                    item.estimated_cost_per_unit *
                      Number(item.recipe_ingredient_base.quantity) *
                      Number(planningRecipe.nb_serving),
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
