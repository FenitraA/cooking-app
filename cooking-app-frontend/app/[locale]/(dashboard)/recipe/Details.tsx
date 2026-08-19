"use client";

import { getErrorMessage, UnauthorizedError } from "@/lib/errors";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

import Field from "@/components/forms/Field";
import { useTranslations } from "next-intl";
import { Button } from "flowbite-react";
import SafeImage from "@/components/forms/SafeImage";
import { X } from "lucide-react";

import { uploadImagesToCloudinary } from "@/lib/utils";
import {
  RecipeBase,
  RecipeImageData,
  RecipeIngredientBase,
  RecipeUpdateData,
} from "@/lib/recipe/types";
import { isRecipeDirty } from "@/lib/recipe/services";
import {
  fetchRecipeById,
  setRecipeImage,
  updateRecipe,
} from "@/lib/recipe/api";
import TextAreaField from "@/components/forms/TextAreaField";
import IngredientChoice from "./IngredientChoice";

export default function RecipeDetailsPage({
  onUpdated,
  recipeId,
}: {
  onUpdated?: () => void;
  recipeId: string;
}) {
  const translations = useTranslations("Recipe");
  const general_translations = useTranslations("General");
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [image, setImage] = useState<File | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [recipe, setRecipe] = useState<RecipeUpdateData>({
    id: "",
    name: "",
    description: "",
    estimated_time: "0",
    parallel_cooking: "0",
    recipe_ingredients: [],
  });

  const [initialValues, setInitialValues] = useState<RecipeBase | null>(null);
  const [initialRecipeIngredients, setInitialRecipeIngredients] = useState<
    RecipeIngredientBase[]
  >([]);
  const [submitting, setSubmitting] = useState(false);
  const [submittingImage, setSubmittingImage] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageSuccess, setImageSuccess] = useState<string | null>(null);

  const isDirty = useMemo(() => {
    if (!initialValues) return false;
    return isRecipeDirty(
      {
        name: initialValues?.name ?? "",
        description: initialValues?.description ?? "",
        estimated_time: initialValues?.estimated_time ?? "0",
        parallel_cooking: initialValues?.parallel_cooking ?? "0",
        recipe_ingredients: initialRecipeIngredients,
      },
      {
        name: recipe.name,
        description: recipe.description,
        estimated_time: recipe.estimated_time,
        parallel_cooking: recipe.parallel_cooking,
        recipe_ingredients: recipe.recipe_ingredients,
      },
    );
  }, [
    initialValues,
    initialRecipeIngredients,
    recipe.name,
    recipe.description,
    recipe.estimated_time,
    recipe.parallel_cooking,
    recipe.recipe_ingredients,
  ]);

  useEffect(() => {
    const urls = image ? [URL.createObjectURL(image)] : [];
    setImagePreviews(urls);

    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [image]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const item = await fetchRecipeById(recipeId);
        if (cancelled) return;

        setInitialValues(item.recipe);

        const recipe_ingredients_bases = item.recipe_ingredients.map(
          (recipe_ingredient) => ({
            ...recipe_ingredient.recipe_ingredient_base,
            ingredient_name: recipe_ingredient.ingredient_name,
            ingredient_unit: recipe_ingredient.ingredient_unit,
          }),
        );

        setInitialRecipeIngredients(recipe_ingredients_bases);
        setRecipe((p) => ({ ...p, ...item.recipe }));
        setRecipe((p) => ({
          ...p,
          recipe_ingredients: recipe_ingredients_bases,
        }));
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

    if (!recipeId) return;
    load();

    return () => {
      cancelled = true;
    };
  }, [router, recipeId]);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!recipe.name.trim())
      return setError(translations("errors.required_name"));
    if (!recipe.description.trim())
      return setError(translations("errors.required_description"));
    if (!recipe.estimated_time || Number(recipe.estimated_time) <= 0)
      return setError(translations("errors.required_estimated_time"));
    if (!recipe.parallel_cooking || Number(recipe.parallel_cooking) <= 0)
      return setError(translations("errors.required_parallel_cooking"));
    if (!recipe.recipe_ingredients || recipe.recipe_ingredients.length <= 0)
      return setError(translations("errors.required_ingredients"));

    if (!isDirty) return;

    setSubmitting(true);
    try {
      const updatedIngredient = await updateRecipe(recipe);
      setInitialValues(updatedIngredient.recipe);

      const recipe_ingredients_bases = updatedIngredient.recipe_ingredients.map(
        (recipe_ingredient) => ({
          ...recipe_ingredient.recipe_ingredient_base,
          ingredient_name: recipe_ingredient.ingredient_name,
          ingredient_unit: recipe_ingredient.ingredient_unit,
        }),
      );

      setInitialRecipeIngredients(recipe_ingredients_bases);
      setRecipe((p) => ({ ...p, ...updatedIngredient.recipe }));
      setRecipe((p) => ({
        ...p,
        recipe_ingredients: recipe_ingredients_bases,
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

  async function handleImageSubmit(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    setImageError(null);
    setImageSuccess(null);

    if (image) {
      setSubmittingImage(true);
      try {
        const uploaded = await uploadImagesToCloudinary(
          [image],
          `recipes/${recipe.id}`,
        );
        if (uploaded.length === 0) {
          throw new Error(general_translations("errors.upload_error"));
        }
        const uploaded_image = uploaded[0];

        const imageBody: RecipeImageData = {
          id: recipe.id,
          image_url: uploaded_image.secure_url,
          storage_key: uploaded_image.public_id,
        };

        await setRecipeImage(imageBody);
        setImageSuccess(translations("success.image_change_success"));
      } catch (e: unknown) {
        if (e instanceof UnauthorizedError) {
          router.replace("/login");
          return;
        }
        const msg = getErrorMessage(e);
        setImageError(translations("errors.update_failed", { message: msg }));
      } finally {
        setSubmittingImage(false);
      }
    }
  }

  function onPickImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setImage(files[0] || null);

    e.target.value = "";
  }

  return (
    <div className="flex flex-row relative rounded-xl h-auto gap-4">
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-xl">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-gray-800" />
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col xl:flex-row gap-6">
        <div className="flex flex-col justify-between space-y-6 w-full flex-1 xl:min-w-80rounded-xl sm:bg-white/10 sm:border border-white/20">
          <div className="flex flex-row gap-6 py-6 sm:px-6 items-end flex-wrap">
            <Field
              className="w-full"
              label={translations("fields.name")}
              value={recipe.name}
              onChange={(v) => setRecipe((p) => ({ ...p, name: v }))}
              placeholder={translations("fields.name")}
            />
            <Field
              className="w-full"
              type="decimal"
              label={translations("fields.estimated_time")}
              value={String(recipe.estimated_time ?? "")}
              onChange={(v) =>
                setRecipe((p) => ({ ...p, estimated_time: v }))
              }
              placeholder={translations("fields.estimated_time")}
            />
            <Field
              className="w-full"
              type="decimal"
              label={translations("fields.parallel_cooking")}
              value={String(recipe.parallel_cooking ?? "")}
              onChange={(v) =>
                setRecipe((p) => ({ ...p, parallel_cooking: v }))
              }
              placeholder={translations("fields.parallel_cooking")}
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

            <div className="border rounded-xl bg-white/10 p-4 border-white/20 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm shadow-sm cursor-pointer text-gray-300">
                  <span>{translations("images.choose_new")}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={onPickImages}
                  />
                </label>
              </div>

              <div className="mt-4 flex flex-wrap gap-4">
                {imagePreviews.map((src, i) => (
                  <div
                    key={src}
                    className="relative rounded-xl border border-white/20 bg-white/10 shadow-sm w-full sm:w-1/2 lg:w-1/3"
                  >
                    <div className="relative h-18 w-full">
                      <SafeImage
                        src={src}
                        alt={`preview-${i}`}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover rounded-t-xl"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setImage(null)}
                      className="flex flex-row justify-center items-center absolute -right-3 -top-3 rounded-4xl w-7 h-7 bg-red-500 text-xs border shadow-sm hover:bg-red-800 cursor-pointer"
                      aria-label={general_translations("actions.select")}
                    >
                      <X size={16} className="text-white" />
                    </button>

                    <div className="p-2 text-xs text-gray-300 rounded-b-xl bg-white/10">
                      {image?.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col justify-center gap-2 py-4 w-full border-t border-white/20">
              <Button
                type="button"
                disabled={submittingImage || !image}
                onClick={handleImageSubmit}
                className="h-10 rounded-lg bg-custom-validation-green px-5 text-sm text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:bg-custom-validation-green/90"
              >
                {submittingImage
                  ? general_translations("actions.saving")
                  : general_translations("actions.save_image_changes")}
              </Button>

              {imageSuccess && (
                <div className="rounded-lg bg-white/10 px-3 py-2 text-sm text-green-500 w-full">
                  {imageSuccess}
                </div>
              )}

              {imageError && (
                <div className="rounded-lg bg-white/10 px-3 py-2 text-sm text-red-500 w-full">
                  {imageError}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col space-y-6  w-full flex-1 xl:min-w-120 sm:border rounded-xl sm:bg-white/10 border-white/20">
          <header className="text-center mb-2 py-2 border-b border-custom-sand-dune mt-2">
            <h2 className="text-md font-semibold text-custom-sand-dune tracking-tight">
              {translations("fields.ingredients")}
            </h2>
          </header>
          <IngredientChoice
            values={recipe.recipe_ingredients}
            onChange={(recipe_ingredients) =>
              setRecipe((p) => ({
                ...p,
                recipe_ingredients: recipe_ingredients,
              }))
            }
            className="sm:px-6"
          />
        </div>
        <div className="flex flex-col space-y-6 w-full flex-1 xl:min-w-80 sm:border rounded-xl sm:bg-white/10 border-white/20">
          <header className="text-center mb-2 px-2 py-2 border-b border-custom-sand-dune sm:mx-4 mt-2">
            <h2 className="text-md font-semibold text-custom-sand-dune tracking-tight">
              {translations("fields.description")}
            </h2>
          </header>
          <TextAreaField
            value={recipe.description}
            onChange={(v) => setRecipe((p) => ({ ...p, description: v }))}
            className="h-130 sm:mx-4 py-3"
          />
        </div>
      </form>
    </div>
  );
}
