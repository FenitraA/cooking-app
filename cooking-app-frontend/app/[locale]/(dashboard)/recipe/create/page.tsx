"use client";
import Field from "@/components/forms/Field";
import { getErrorMessage, UnauthorizedError } from "@/lib/errors";
import { Button } from "flowbite-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { uploadImagesToCloudinary } from "@/lib/utils";
import SafeImage from "@/components/forms/SafeImage";
import { RecipeCreate, RecipeImageData } from "@/lib/recipe/types";
import { createRecipe, setRecipeImage } from "@/lib/recipe/api";
import IngredientChoice from "../IngredientChoice";

export default function RecipeCreatePage({
  onCreated,
}: {
  onCreated?: () => void;
}) {
  const router = useRouter();
  const translations = useTranslations("Recipe");
  const generalTranslations = useTranslations("General");

  const [recipe, setRecipe] = useState<RecipeCreate>({
    id: "",
    name: "",
    refHouseholdId: "",
    description: "",
    estimatedTime: "0",
    parallelCooking: "1",
    imageUrl: null,
    storageKey: null,
    recipeIngredients: [],
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [image, setImage] = useState<File | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = image ? [URL.createObjectURL(image)] : [];
    setImagePreviews(urls);

    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [image]);

  function onPickImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setImage(files[0] || null);

    e.target.value = "";
  }

  function removeImage() {
    setImage(null);
  }

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

    setSubmitting(true);

    try {
      const created = await createRecipe(recipe);
      const recipeId = created.recipe.id;

      if (image) {
        const uploaded = await uploadImagesToCloudinary(
          [image],
          `recipes/${recipeId}`,
        );
        if (uploaded.length === 0) {
          throw new Error(generalTranslations("errors.uploadError"));
        }
        const uploadedImage = uploaded[0];

        const imageBody: RecipeImageData = {
          id: recipeId,
          imageUrl: uploadedImage.secureUrl,
          storageKey: uploadedImage.publicId,
        };

        await setRecipeImage(imageBody);
      }

      setSuccess(translations("success.created"));
      setRecipe((v) => ({
        ...v,
        id: "",
        name: "",
        refHouseholdId: "",
        description: "",
        estimatedTime: "0",
        parallelCooking: "1",
        imageUrl: null,
        storageKey: null,
        recipeIngredients: [],
      }));
      setImage(null);
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
    <div className="flex flex-col rounded-xl border w-full mx-auto min-h-full bg-white/10 py-4 px-6 shadow-hard-br space-y-6 mt-6">
      <header className="relative mb-4 mx-1 flex items-center justify-center rounded-xl border border-custom-sand-dune/30 bg-custom-sand-dune/5 px-6 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight text-custom-sand-dune">
            {translations("createTitle")}
          </h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col xl:flex-row gap-6">
        <div className="flex flex-col space-y-6 w-full flex-1 sm:border rounded-xl sm:bg-white/10 border-white/20">
          <header className="text-center mb-2 px-2 py-2 border-b border-custom-sand-dune mx-4 mt-2">
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
          <header className="text-center mb-2 px-2 py-2 border-b border-custom-sand-dune mx-4 mt-2">
            <h2 className="text-md font-semibold text-custom-sand-dune tracking-tight">
              {translations("fields.description")}
            </h2>
          </header>
          <Field
            type="textarea"
            value={recipe.description}
            onChange={(v) => setRecipe((p) => ({ ...p, description: v }))}
            className="h-60 md:h-90 xl:h-130 sm:mx-4 py-3"
          />
        </div>
        <div className="flex flex-col justify-between space-y-6 w-full flex-1 xl:min-w-80">
          <div className="flex items-end sm:border rounded-xl flex-wrap sm:bg-white/10 border-white/20">
            <header className="text-center mb-2 px-2 py-2 border-b border-custom-sand-dune w-full mx-4 mt-2">
              <h2 className="text-md font-semibold text-custom-sand-dune tracking-tight">
                {translations("basicInfos")}
              </h2>
            </header>
            <div className="flex flex-row justify-left gap-6 sm:p-6 py-2 items-end flex-wrap">
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
                onChange={(v) =>
                  setRecipe((p) => ({ ...p, estimatedTime: v }))
                }
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
            </div>
          </div>

          <div className="border rounded-xl bg-white/10 p-4 border-white/20 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm shadow-sm cursor-pointer text-gray-300">
                <span>{translations("images.choose")}</span>
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
                    onClick={() => removeImage()}
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
          <div className="space-y-3">
            <Button
              type="submit"
              disabled={submitting}
              className="h-10 w-full rounded-lg bg-custom-validation-green px-5 text-sm text-white disabled:bg-white/10 disabled:cursor-not-allowed cursor-pointer hover:bg-custom-validation-green/90"
            >
              {submitting
                ? generalTranslations("actions.saving")
                : translations("actions.save")}
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
        </div>
      </form>
    </div>
  );
}
