"use client";
import Field from "@/components/forms/Field";
import { getErrorMessage, UnauthorizedError } from "@/lib/errors";
import { Button } from "flowbite-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getRecipeName } from "@/lib/utils";
import GeneralAutocomplete from "@/components/forms/GeneralAutocomplete";
import { PlanningRecipeCreate } from "@/lib/planning/types";
import { createPlanningRecipe } from "@/lib/planning/api";
import { fetchRecipeByName } from "@/lib/recipe/api";
import { RecipeBase } from "@/lib/recipe/types";
import MultipleDateField from "@/components/forms/MultipleDateField";
import { toPythonCompatibleDate } from "@/lib/planning/services";

export default function CreatePlanning({
  onCreated,
}: {
  onCreated?: () => void;
}) {
  const router = useRouter();
  const translations = useTranslations("Planning");
  const general_translations = useTranslations("General");

  const [planningRecipe, setPlanningRecipe] = useState<PlanningRecipeCreate>({
    id: "",
    ref_recipe_id: "",
    ref_household_id: "",
    planning_date: "2000-01-01",
    description: "",
    nb_serving: "0",
    planning_dates: [],
  });

  const [planningDates, setPlanningDates] = useState<Date[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedRecipe, setSelectedRecipe] = useState<RecipeBase | null>(null);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!planningRecipe.ref_recipe_id.trim())
      return setError(translations("errors.required_recipe"));
    if (planningRecipe.planning_dates.length == 0)
      return setError(translations("errors.required_planning_date"));
    if (!planningRecipe.nb_serving || Number(planningRecipe.nb_serving) <= 0)
      return setError(translations("errors.required_nb_serving"));
    setSubmitting(true);

    try {
      console.log(planningRecipe.planning_dates);
      await createPlanningRecipe(planningRecipe);

      setPlanningRecipe((v) => ({
        ...v,
        id: "",
        ref_recipe_id: "",
        ref_household_id: "",
        planning_date: "",
        nb_serving: "0",
        state: 1,
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
    <div className="flex flex-col rounded-xl border w-full mx-auto min-h-full bg-white/10 py-4 px-6 shadow-hard-br space-y-6">
      <header className="relative mx-1 flex items-center justify-center rounded-xl border border-custom-sand-dune/30 bg-custom-sand-dune/5 px-6 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight text-custom-sand-dune">
            {translations("create_title")}
          </h1>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col flex-1 justify-between h-full space-y-6"
      >
        <div className="flex items-end rounded-xl flex-wrap">
          <div className="flex flex-col justify-left gap-6 sm:px-6 py-6 items-end">
            <GeneralAutocomplete<RecipeBase>
              label={translations("fields.choose_recipe")}
              translationsKey="Recipe"
              showShadow={false}
              className="w-full lg:min-w-50"
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
              className="w-full lg:min-w-50"
              value={String(planningRecipe.nb_serving ?? "")}
              onChange={(v) =>
                setPlanningRecipe((p) => ({
                  ...p,
                  nb_serving: v,
                }))
              }
            />
            <MultipleDateField
              label={translations("fields.planning_date")}
              className="w-full lg:min-w-50"
              value={planningDates}
              onChange={(v) => {
                setPlanningRecipe((p) => ({
                  ...p,
                  planning_dates: toPythonCompatibleDate(v || []),
                }));
                setPlanningDates(v || []);
              }}
            />
          </div>
        </div>

        <div className="space-y-3">
          <Button
            type="submit"
            disabled={submitting}
            className="h-10 w-full rounded-lg bg-custom-validation-green px-5 text-sm text-white disabled:bg-white/10 disabled:cursor-not-allowed cursor-pointer hover:bg-custom-validation-green/90"
          >
            {submitting
              ? general_translations("actions.saving")
              : translations("actions.save")}
          </Button>

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
