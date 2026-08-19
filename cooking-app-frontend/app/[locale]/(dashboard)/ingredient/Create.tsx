"use client";
import Field from "@/components/forms/Field";
import { getErrorMessage, UnauthorizedError } from "@/lib/errors";
import { Button } from "flowbite-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  IngredientBase,
  IngredientImageData,
  IngredientTypeBase,
  IngredientUnitBase,
} from "@/lib/ingredient/types";
import {
  createIngredient,
  fetchIngredientTypes,
  fetchIngredientUnits,
  setIngredientImage,
} from "@/lib/ingredient/api";
import {
  getIngredientTypeName,
  getIngredientUnitName,
  uploadImagesToCloudinary,
} from "@/lib/utils";
import GeneralAutocomplete from "@/components/forms/GeneralAutocomplete";
import SafeImage from "@/components/forms/SafeImage";

export default function IngredientCreatePage({
  onCreated,
}: {
  onCreated?: () => void;
}) {
  const router = useRouter();
  const translations = useTranslations("Ingredient");
  const general_translations = useTranslations("General");

  const [ingredient, setIngredient] = useState<IngredientBase>({
    id: "",
    name: "",
    ref_ingredient_unit_id: "",
    ref_ingredient_type_id: "",
    estimated_price: "0",
    image_url: null,
    storage_key: null,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [image, setImage] = useState<File | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [selectedIngredientType, setSelectedIngredientType] =
    useState<IngredientTypeBase | null>(null);

  const [selectedIngredientUnit, setSelectedIngredientUnit] =
    useState<IngredientUnitBase | null>(null);
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

    if (!ingredient.name.trim())
      return setError(translations("errors.required_name"));
    if (!ingredient.ref_ingredient_unit_id.trim())
      return setError(translations("errors.required_unit"));
    if (!ingredient.ref_ingredient_type_id.trim())
      return setError(translations("errors.required_ingredient_type_id"));
    if (!ingredient.estimated_price || Number(ingredient.estimated_price) <= 0)
      return setError(translations("errors.required_estimated_price"));

    setSubmitting(true);

    try {
      const created = await createIngredient(ingredient);
      const ingredientId = created.id;

      if (image) {
        const uploaded = await uploadImagesToCloudinary(
          [image],
          `ingredients/${ingredientId}`,
        );
        if (uploaded.length === 0) {
          throw new Error(general_translations("errors.upload_error"));
        }
        const uploaded_image = uploaded[0];

        const imageBody: IngredientImageData = {
          id: ingredientId,
          image_url: uploaded_image.secure_url,
          storage_key: uploaded_image.public_id,
        };

        await setIngredientImage(imageBody);
      }

      setSuccess(translations("success.created"));
      setIngredient((v) => ({
        ...v,
        id: "",
        name: "",
        unit: "",
        estimated_price: "0",
        image_url: null,
        storage_key: null,
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
    <div className="flex flex-col rounded-xl border w-full mx-auto min-h-full bg-white/10 py-4 px-6 shadow-hard-br space-y-6">
      <header className="text-center mb-3 px-6 py-2 border-b-2 border-custom-sand-dune">
        <h1 className="text-xl font-semibold text-custom-sand-dune tracking-tight">
          {translations("create_title")}
        </h1>
      </header>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col flex-1 justify-between h-full space-y-6"
      >
        <div className="flex flex-row justify-left gap-6 items-end flex-wrap">
          <Field
            className="w-full"
            label={translations("fields.name")}
            value={ingredient.name}
            onChange={(v) => setIngredient((p) => ({ ...p, name: v }))}
            placeholder={translations("fields.name")}
          />
          <GeneralAutocomplete<IngredientUnitBase>
            label={translations("fields.unit")}
            translationsKey="Ingredient"
            showShadow={false}
            className="w-full"
            value={selectedIngredientUnit}
            onSelect={(d) => {
              setSelectedIngredientUnit(d);
              setIngredient((p) => ({ ...p, ref_ingredient_unit_id: d.id }));
            }}
            onClear={() => {
              setSelectedIngredientUnit(null);
              setIngredient((p) => ({ ...p, ref_ingredient_unit_id: "" }));
            }}
            getName={getIngredientUnitName}
            fetchOptions={fetchIngredientUnits}
          />
          <Field
            className="w-full"
            type="decimal"
            label={translations("fields.estimated_price")}
            value={String(ingredient.estimated_price ?? "")}
            onChange={(v) =>
              setIngredient((p) => ({ ...p, estimated_price: v }))
            }
            placeholder={translations("fields.estimated_price")}
          />
          <GeneralAutocomplete<IngredientTypeBase>
            label={translations("fields.ingredient_type")}
            translationsKey="Ingredient"
            showShadow={false}
            className="w-full"
            value={selectedIngredientType}
            onSelect={(d) => {
              setSelectedIngredientType(d);
              setIngredient((p) => ({ ...p, ref_ingredient_type_id: d.id }));
            }}
            onClear={() => {
              setSelectedIngredientType(null);
              setIngredient((p) => ({ ...p, ref_ingredient_type_id: "" }));
            }}
            getName={getIngredientTypeName}
            fetchOptions={fetchIngredientTypes}
          />
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
      </form>
    </div>
  );
}
