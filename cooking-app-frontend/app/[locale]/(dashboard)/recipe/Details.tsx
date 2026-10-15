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
import IngredientChoice from "./IngredientChoice";

export default function RecipeDetailsPage({
  onUpdated,
  recipeId,
}: {
  onUpdated?: () => void;
  recipeId: string;
}) {
  const translations = useTranslations("Recipe");
  const generalTranslations = useTranslations("General");
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [image, setImage] = useState<File | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [recipe, setRecipe] = useState<RecipeUpdateData>({
    id: "",
    name: "",
    description: "",
    estimatedTime: "0",
    parallelCooking: "0",
    recipeIngredients: [],
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
        estimatedTime: initialValues?.estimatedTime ?? "0",
        parallelCooking: initialValues?.parallelCooking ?? "0",
        recipeIngredients: initialRecipeIngredients,
      },
      {
        name: recipe.name,
        description: recipe.description,
        estimatedTime: recipe.estimatedTime,
        parallelCooking: recipe.parallelCooking,
        recipeIngredients: recipe.recipeIngredients,
      },
    );
  }, [
    initialValues,
    initialRecipeIngredients,
    recipe.name,
    recipe.description,
    recipe.estimatedTime,
    recipe.parallelCooking,
    recipe.recipeIngredients,
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

        const recipeIngredientsBases = item.recipeIngredients.map(
          (recipeIngredient) => ({
            ...recipeIngredient.recipeIngredientBase,
            ingredientName: recipeIngredient.ingredientName,
            ingredientUnit: recipeIngredient.ingredientUnit,
          }),
        );

        setInitialRecipeIngredients(recipeIngredientsBases);
        setRecipe((p) => ({ ...p, ...item.recipe }));
        setRecipe((p) => ({
          ...p,
          recipeIngredients: recipeIngredientsBases,
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
      return setError(translations("errors.requiredName"));
    if (!recipe.description.trim())
      return setError(translations("errors.requiredDescription"));
    if (!recipe.estimatedTime || Number(recipe.estimatedTime) <= 0)
      return setError(translations("errors.requiredEstimatedTime"));
    if (!recipe.parallelCooking || Number(recipe.parallelCooking) <= 0)
      return setError(translations("errors.requiredParallelCooking"));
    if (!recipe.recipeIngredients || recipe.recipeIngredients.length <= 0)
      return setError(translations("errors.requiredIngredients"));

    if (!isDirty) return;

    setSubmitting(true);
    try {
      const updatedIngredient = await updateRecipe(recipe);
      setInitialValues(updatedIngredient.recipe);

      const recipeIngredientsBases = updatedIngredient.recipeIngredients.map(
        (recipeIngredient) => ({
          ...recipeIngredient.recipeIngredientBase,
          ingredientName: recipeIngredient.ingredientName,
          ingredientUnit: recipeIngredient.ingredientUnit,
        }),
      );

      setInitialRecipeIngredients(recipeIngredientsBases);
      setRecipe((p) => ({ ...p, ...updatedIngredient.recipe }));
      setRecipe((p) => ({
        ...p,
        recipeIngredients: recipeIngredientsBases,
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
          throw new Error(generalTranslations("errors.uploadError"));
        }
        const uploadedImage = uploaded[0];

        const imageBody: RecipeImageData = {
          id: recipe.id,
          imageUrl: uploadedImage.secureUrl,
          storageKey: uploadedImage.publicId,
        };

        await setRecipeImage(imageBody);
        setImageSuccess(translations("success.imageChangeSuccess"));
      } catch (e: unknown) {
        if (e instanceof UnauthorizedError) {
          router.replace("/login");
          return;
        }
        const msg = getErrorMessage(e);
        setImageError(translations("errors.updateFailed", { message: msg }));
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
              id="name"
              className="w-full"
              label={translations("fields.name")}
              value={recipe.name}
              onChange={(v) => setRecipe((p) => ({ ...p, name: v }))}
              placeholder={translations("fields.name")}
            />
            <Field
              id="estimatedTime"
              className="w-full"
              type="decimal"
              label={translations("fields.estimatedTime")}
              value={String(recipe.estimatedTime ?? "")}
              onChange={(v) => setRecipe((p) => ({ ...p, estimatedTime: v }))}
              placeholder={translations("fields.estimatedTime")}
            />
            <Field
              id="parallelCooking"
              className="w-full"
              type="decimal"
              label={translations("fields.parallelCooking")}
              value={String(recipe.parallelCooking ?? "")}
              onChange={(v) =>
                setRecipe((p) => ({ ...p, parallelCooking: v }))
              }
              placeholder={translations("fields.parallelCooking")}
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

            <div className="border rounded-xl bg-white/10 p-4 border-white/20 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm shadow-sm cursor-pointer text-gray-300">
                  <span>{translations("images.chooseNew")}</span>
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
                      aria-label={generalTranslations("actions.select")}
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
                  ? generalTranslations("actions.saving")
                  : generalTranslations("actions.saveImageChanges")}
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
            values={recipe.recipeIngredients}
            onChange={(recipeIngredients) =>
              setRecipe((p) => ({
                ...p,
                recipeIngredients: recipeIngredients,
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
          <Field
            type="textarea"
            value={recipe.description}
            onChange={(v) => setRecipe((p) => ({ ...p, description: v }))}
            className="h-130 sm:mx-4 py-3"
          />
        </div>
      </form>
    </div>
  );
}
