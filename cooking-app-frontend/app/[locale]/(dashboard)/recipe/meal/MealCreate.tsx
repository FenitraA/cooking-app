import { Button } from "flowbite-react";
import {
  formatNumberToCurrency,
  getMealIngredientStockDescription,
  getRecipeName,
} from "@/lib/utils";

import { useSearchParams } from "next/navigation";
import { getErrorMessage, UnauthorizedError } from "@/lib/errors";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  createMeal,
  fetchRecipeById,
  fetchRecipeByName,
  getMealSetupFromRecipe as getMealSetupFromRecipe,
} from "@/lib/recipe/api";
import MealIngredientChoice from "./MealIngredientChoice";
import GeneralAutocomplete from "@/components/forms/GeneralAutocomplete";
import Field from "@/components/forms/Field";
import { NotebookText } from "lucide-react";
import { MealCreate, RecipeBase } from "@/lib/recipe/types";

export default function MealCreatePage({
  onCreated,
}: {
  onCreated?: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idRecipeParam = searchParams.get("idRecipe");
  const nbServingParam = searchParams.get("nbServing");

  const translations = useTranslations("Meal");
  const generalTranslations = useTranslations("General");

  const [selectedRecipe, setSelectedRecipe] = useState<RecipeBase | null>(null);

  const [meal, setMeal] = useState<MealCreate>({
    id: "",
    refRecipeId: "",
    nbServing: "0",
    mealIngredients: [],
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // const [success, setSuccess] = useState<string | null>(null);

  const [loadingMealSetup, setLoadingMealSetup] = useState(false);

  const [nbServing, setNbServing] = useState("0");

  const totalPrice = useMemo(
    () =>
      meal.mealIngredients.reduce(
        (sum, ingredient) => sum + (Number(ingredient.totalPrice) ?? 0),
        0,
      ),
    [meal.mealIngredients],
  );

  useEffect(() => {
    if (!idRecipeParam) return;

    let cancelled = false;

    async function loadRecipe() {
      try {
        if (!idRecipeParam) return;

        const recipe = await fetchRecipeById(idRecipeParam);

        if (nbServingParam) {
          const value = Number(nbServingParam);

          if (!Number.isNaN(value)) {
            setNbServing(nbServingParam);
          }
        }

        if (!cancelled) {
          setSelectedRecipe(recipe.recipe);
        }
      } catch (e) {
        console.error(e);
      }
    }

    loadRecipe();

    return () => {
      cancelled = true;
    };
  }, [idRecipeParam, nbServingParam]);

  async function mealSetup() {
    setError(null);

    if (!selectedRecipe) return;

    if (Number(nbServing) <= 0)
      return setError(translations("errors.requiredNbServing"));

    setLoadingMealSetup(true);
    try {
      const mealIngredients = await getMealSetupFromRecipe(
        selectedRecipe.id,
        Number(nbServing),
      );
      const mealIngredientsBases = mealIngredients.map((element) => ({
        id: "",
        refMealId: "",
        refIngredientUnitId: "",
        refIngredientStockId:
          element.mealIngredientBase.refIngredientStockId,
        ingredientName: element.ingredientName, // optional, only for reads
        ingredientUnit: element.ingredientUnit, // optional, only for reads
        stockDescription: getMealIngredientStockDescription(element), // optional, only for reads
        totalPrice: String(element.totalPrice),
        quantity: element.mealIngredientBase.quantity,
      }));

      setMeal((p) => ({ ...p, mealIngredients: mealIngredientsBases }));
    } catch (e: unknown) {
      if (e instanceof UnauthorizedError) {
        router.replace("/login");
        return;
      }
      const msg = getErrorMessage(e);
      setError(translations("errors.setupFailed", { message: msg }));
    } finally {
      setLoadingMealSetup(false);
    }
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    // setSuccess(null);

    if (!selectedRecipe) return;

    const mealToCreate: MealCreate = {
      ...meal,
      refRecipeId: selectedRecipe.id,
      nbServing: nbServing,
    };

    if (Number(mealToCreate.nbServing) <= 0)
      return setError(translations("errors.requiredNbServing"));

    if (mealToCreate.mealIngredients.length <= 0)
      return setError(translations("errors.requiredIngredients"));

    setSubmitting(true);

    try {
      await createMeal(mealToCreate);

      // setSuccess(translations("success.created"));
      setMeal((v) => ({
        ...v,
        id: "",
        refRecipeId: "",
        nbServing: "0",
        mealIngredients: [],
      }));
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
    <form onSubmit={handleSubmit} className="flex flex-col flex-wrap gap-6">
      <header className="relative mx-1 flex items-center justify-center rounded-xl border border-custom-sand-dune/30 bg-custom-sand-dune/5 px-6 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight text-custom-sand-dune">
            {translations("createTitle")}
          </h1>
        </div>
      </header>
      <div className="flex flex-row flex-wrap items-end border-b border-white/20 mx-4 pb-4 gap-6">
        <GeneralAutocomplete<RecipeBase>
          label={translations("chooseRecipe")}
          translationsKey="Recipe"
          showShadow={false}
          className="w-full sm:min-w-80"
          value={selectedRecipe}
          onSelect={(d) => {
            setSelectedRecipe(d);
          }}
          onClear={() => {
            setSelectedRecipe(null);
          }}
          getName={getRecipeName}
          fetchOptions={fetchRecipeByName}
        />
        <div className="flex flex-row gap-6 items-end">
          <Field
            id="nbServing"
            label={translations("fields.nbServing")}
            type="decimal"
            className="w-full sm:min-w-40"
            value={String(nbServing ?? "")}
            onChange={(v) => setNbServing(v || "0")}
          />
          <button
            type="button"
            onClick={mealSetup}
            disabled={loadingMealSetup}
            className="h-10 px-3 rounded-lg bg-custom-validation-green text-white disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed hover:bg-custom-validation-green/90"
          >
            <NotebookText size={18} />
          </button>
        </div>
      </div>
      <header className="relative mx-1 flex items-center justify-center rounded-xl border border-custom-sand-dune/30 bg-custom-sand-dune/5 px-4 py-2 shadow-sm">
        <div className="flex items-center gap-2">
          <h2 className="text-md font-semibold tracking-tight text-custom-sand-dune">
            {translations("mealIngredients")}
          </h2>
        </div>
      </header>
      <MealIngredientChoice
        values={meal.mealIngredients}
        onChange={(mealIngredients) =>
          setMeal((p) => ({
            ...p,
            mealIngredients: mealIngredients,
          }))
        }
        className="border-b border-white/20 pb-4 mx-4"
      />
      <div className="text-sm text-gray-300 mx-4">
        <span className="underline">{generalTranslations("totalCost")}</span>{" "}
        : {formatNumberToCurrency(totalPrice)}
      </div>
      <div className="flex flex-col space-y-3 pb-4 mx-4">
        <Button
          type="submit"
          disabled={submitting}
          className="h-10 w-full sm:min-w-80 rounded-lg bg-custom-validation-green px-5 text-sm text-white disabled:bg-white/10 disabled:cursor-not-allowed cursor-pointer hover:bg-custom-validation-green/90"
        >
          {submitting
            ? generalTranslations("actions.saving")
            : translations("actions.save")}
        </Button>
        {/* 
        {success && (
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
