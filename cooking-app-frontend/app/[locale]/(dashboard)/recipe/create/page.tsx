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
import TextAreaField from "@/components/forms/TextAreaField";
import IngredientChoice from "../IngredientChoice";

export default function RecipeCreatePage({
  onCreated,
}: {
  onCreated?: () => void;
}) {
  const router = useRouter();
  const translations = useTranslations("Recipe");
  const general_translations = useTranslations("General");

  const [recipe, setRecipe] = useState<RecipeCreate>({
    id: "",
    name: "",
    ref_household_id: "",
    description: "",
    estimated_time: "0",
    parallel_cooking: "1",
    image_url: null,
    storage_key: null,
    recipe_ingredients: [],
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
      return setError(translations("errors.required_name"));
    if (!recipe.description.trim())
      return setError(translations("errors.required_description"));
    if (!recipe.estimated_time || Number(recipe.estimated_time) <= 0)
      return setError(translations("errors.required_estimated_time"));
    if (!recipe.parallel_cooking || Number(recipe.parallel_cooking) <= 0)
      return setError(translations("errors.required_parallel_cooking"));
    if (!recipe.recipe_ingredients || recipe.recipe_ingredients.length <= 0)
      return setError(translations("errors.required_ingredients"));

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
          throw new Error(general_translations("errors.upload_error"));
        }
        const uploaded_image = uploaded[0];

        const imageBody: RecipeImageData = {
          id: recipeId,
          image_url: uploaded_image.secure_url,
          storage_key: uploaded_image.public_id,
        };

        await setRecipeImage(imageBody);
      }

      setSuccess(translations("success.created"));
      setRecipe((v) => ({
        ...v,
        id: "",
        name: "",
        ref_household_id: "",
        description: "",
        estimated_time: "0",
        parallel_cooking: "1",
        image_url: null,
        storage_key: null,
        recipe_ingredients: [],
      }));
      setImage(null);
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
    <div className="flex flex-col rounded-xl border w-full mx-auto min-h-full bg-white/10 py-4 px-6 shadow-hard-br space-y-6 mt-6">
      <header className="relative mb-4 mx-1 flex items-center justify-center rounded-xl border border-custom-sand-dune/30 bg-custom-sand-dune/5 px-6 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight text-custom-sand-dune">
            {translations("create_title")}
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
          <header className="text-center mb-2 px-2 py-2 border-b border-custom-sand-dune mx-4 mt-2">
            <h2 className="text-md font-semibold text-custom-sand-dune tracking-tight">
              {translations("fields.description")}
            </h2>
          </header>
          <TextAreaField
            value={recipe.description}
            onChange={(v) => setRecipe((p) => ({ ...p, description: v }))}
            className="h-60 md:h-90 xl:h-130 sm:mx-4 py-3"
          />
        </div>
        <div className="flex flex-col justify-between space-y-6 w-full flex-1 xl:min-w-80">
          <div className="flex items-end sm:border rounded-xl flex-wrap sm:bg-white/10 border-white/20">
            <header className="text-center mb-2 px-2 py-2 border-b border-custom-sand-dune w-full mx-4 mt-2">
              <h2 className="text-md font-semibold text-custom-sand-dune tracking-tight">
                {translations("basic_infos")}
              </h2>
            </header>
            <div className="flex flex-row justify-left gap-6 sm:p-6 py-2 items-end flex-wrap">
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
