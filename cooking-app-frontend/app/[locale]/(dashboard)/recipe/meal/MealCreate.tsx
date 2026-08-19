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
  const general_translations = useTranslations("General");

  const [selectedRecipe, setSelectedRecipe] = useState<RecipeBase | null>(null);

  const [meal, setMeal] = useState<MealCreate>({
    id: "",
    ref_recipe_id: "",
    nb_serving: "0",
    meal_ingredients: [],
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // const [success, setSuccess] = useState<string | null>(null);

  const [loadingMealSetup, setLoadingMealSetup] = useState(false);

  const [nbServing, setNbServing] = useState("0");

  const totalPrice = useMemo(
    () =>
      meal.meal_ingredients.reduce(
        (sum, ingredient) => sum + (Number(ingredient.total_price) ?? 0),
        0,
      ),
    [meal.meal_ingredients],
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
      return setError(translations("errors.required_nb_serving"));

    setLoadingMealSetup(true);
    try {
      const meal_ingredients = await getMealSetupFromRecipe(
        selectedRecipe.id,
        Number(nbServing),
      );
      const meal_ingredients_bases = meal_ingredients.map((element) => ({
        id: "",
        ref_meal_id: "",
        ref_ingredient_unit_id: "",
        ref_ingredient_stock_id:
          element.meal_ingredient_base.ref_ingredient_stock_id,
        ingredient_name: element.ingredient_name, // optional, only for reads
        ingredient_unit: element.ingredient_unit, // optional, only for reads
        stock_description: getMealIngredientStockDescription(element), // optional, only for reads
        total_price: String(element.total_price),
        quantity: element.meal_ingredient_base.quantity,
      }));

      setMeal((p) => ({ ...p, meal_ingredients: meal_ingredients_bases }));
    } catch (e: unknown) {
      if (e instanceof UnauthorizedError) {
        router.replace("/login");
        return;
      }
      const msg = getErrorMessage(e);
      setError(translations("errors.setup_failed", { message: msg }));
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
      ref_recipe_id: selectedRecipe.id,
      nb_serving: nbServing,
    };

    if (Number(mealToCreate.nb_serving) <= 0)
      return setError(translations("errors.required_nb_serving"));

    if (mealToCreate.meal_ingredients.length <= 0)
      return setError(translations("errors.required_ingredients"));

    setSubmitting(true);

    try {
      await createMeal(mealToCreate);

      // setSuccess(translations("success.created"));
      setMeal((v) => ({
        ...v,
        id: "",
        ref_recipe_id: "",
        nb_serving: "0",
        meal_ingredients: [],
      }));
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
    <form onSubmit={handleSubmit} className="flex flex-col flex-wrap gap-6">
      <header className="text-center mb-2 px-2 py-2 border-b border-custom-sand-dune mx-4 mt-2">
        <h2 className="text-md font-semibold text-custom-sand-dune tracking-tight">
          {translations("create_title")}
        </h2>
      </header>
      <div className="flex flex-row flex-wrap items-end border-b border-white/20 mx-4 pb-4 gap-6">
        <GeneralAutocomplete<RecipeBase>
          label={translations("choose_recipe")}
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
            label={translations("fields.nb_serving")}
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
      <header className="text-center px-2 py-2 border-b border-custom-sand-dune">
        <h2 className="text-md font-semibold text-custom-sand-dune tracking-tight">
          {translations("meal_ingredients")}
        </h2>
      </header>
      <MealIngredientChoice
        values={meal.meal_ingredients}
        onChange={(meal_ingredients) =>
          setMeal((p) => ({
            ...p,
            meal_ingredients: meal_ingredients,
          }))
        }
        className="border-b border-white/20 pb-4 mx-4"
      />
      <div className="text-sm text-gray-300 mx-4">
        <span className="underline">{general_translations("total_cost")}</span> :{" "}
        {formatNumberToCurrency(totalPrice)}
      </div>
      <div className="flex flex-col space-y-3 pb-4 mx-4">
        <Button
          type="submit"
          disabled={submitting}
          className="h-10 w-full sm:min-w-80 rounded-lg bg-custom-validation-green px-5 text-sm text-white disabled:bg-white/10 disabled:cursor-not-allowed cursor-pointer hover:bg-custom-validation-green/90"
        >
          {submitting
            ? general_translations("actions.saving")
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
