"use client";

import { getErrorMessage, UnauthorizedError } from "@/lib/errors";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

import Field from "@/components/forms/Field";
import { useTranslations } from "next-intl";
import { Button } from "flowbite-react";
import {
  IngredientBase,
  IngredientImageData,
  IngredientTypeBase,
  IngredientUnitBase,
  IngredientUpdateData,
} from "@/lib/ingredient/types";
import { isIngredientDirty } from "@/lib/ingredient/services";
import {
  fetchIngredientById,
  fetchIngredientTypes,
  fetchIngredientUnits,
  setIngredientImage,
  updateIngredient,
} from "@/lib/ingredient/api";
import SafeImage from "@/components/forms/SafeImage";
import { X } from "lucide-react";

import GeneralAutocomplete from "@/components/forms/GeneralAutocomplete";
import {
  getIngredientTypeName,
  getIngredientUnitName,
  uploadImagesToCloudinary,
} from "@/lib/utils";
import IngredientStockCreatePage from "./stock/StockCreate";
import IngredientStockListPage from "./stock/StockList";

export default function IngredientDetailsPage({
  onUpdated,
  ingredientID,
}: {
  onUpdated?: () => void;
  ingredientID: string;
}) {
  const [stockRefreshKey, setStockRefreshKey] = useState(0);
  const triggerRefresh = () => setStockRefreshKey((k) => k + 1);

  const translations = useTranslations("Ingredient");
  const generalTranslations = useTranslations("General");
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [image, setImage] = useState<File | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedIngredientType, setSelectedIngredientType] =
    useState<IngredientTypeBase | null>(null);
  const [selectedIngredientUnit, setSelectedIngredientUnit] =
    useState<IngredientUnitBase | null>(null);
  const [quantityLeft, setQuantityLeft] = useState(0);
  const [ingredient, setIngredient] = useState<IngredientUpdateData>({
    id: "",
    name: "",
    refIngredientUnitId: "",
    refIngredientTypeId: "",
    estimatedPrice: "0",
  });

  const [initialValues, setInitialValues] = useState<IngredientBase | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [submittingImage, setSubmittingImage] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageSuccess, setImageSuccess] = useState<string | null>(null);

  const isDirty = useMemo(() => {
    if (!initialValues) return false;
    return isIngredientDirty(
      {
        name: initialValues?.name ?? "",
        ingredientUnitId: initialValues?.refIngredientUnitId ?? "",
        ingredientTypeId: initialValues?.refIngredientTypeId ?? "",
        estimatedPrice: initialValues?.estimatedPrice ?? "0",
      },
      {
        name: ingredient.name,
        ingredientUnitId: ingredient.refIngredientUnitId,
        ingredientTypeId: ingredient.refIngredientTypeId,
        estimatedPrice: ingredient.estimatedPrice,
      },
    );
  }, [
    initialValues,
    ingredient.name,
    ingredient.refIngredientUnitId,
    ingredient.refIngredientTypeId,
    ingredient.estimatedPrice,
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

        const item = await fetchIngredientById(ingredientID);
        if (cancelled) return;

        setInitialValues(item.ingredient);
        setSelectedIngredientUnit(item.ingredientUnit);
        setSelectedIngredientType(item.ingredientType);
        setIngredient(item.ingredient);
        setQuantityLeft(item.quantityLeft);
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

    if (!ingredientID) return;
    load();

    return () => {
      cancelled = true;
    };
  }, [router, ingredientID]);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Verify values (match eng.json keys)
    if (!ingredient.name.trim())
      return setError(translations("errors.requiredName"));
    if (!ingredient.refIngredientUnitId.trim())
      return setError(translations("errors.requiredUnit"));
    if (!ingredient.refIngredientTypeId.trim())
      return setError(translations("errors.requiredIngredientTypeId"));
    if (!ingredient.estimatedPrice || Number(ingredient.estimatedPrice) <= 0)
      return setError(translations("errors.requiredEstimatedPrice"));

    if (!isDirty) return;

    setSubmitting(true);
    try {
      const updatedIngredient = await updateIngredient(ingredient);
      setInitialValues(updatedIngredient.ingredient);
      setIngredient(updatedIngredient.ingredient);
      setQuantityLeft(updatedIngredient.quantityLeft);

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
          `ingredients/${ingredient.id}`,
        );
        if (uploaded.length === 0) {
          throw new Error(generalTranslations("errors.uploadError"));
        }
        const uploadedImage = uploaded[0];

        const imageBody: IngredientImageData = {
          id: ingredient.id,
          imageUrl: uploadedImage.secureUrl,
          storageKey: uploadedImage.publicId,
        };

        await setIngredientImage(imageBody);
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
    <div className="flex flex-col xl:flex-row relative rounded-xl h-auto gap-4">
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-xl">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-gray-800" />
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className="
          flex items-start
          rounded-xl
          flex-wrap
          sm:bg-white/10
          w-full
          xl:w-1/3
        "
      >
        <div className="flex flex-row gap-6 p-3 sm:p-6 items-end flex-wrap">
          <Field
            id="name"
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
              setIngredient((p) => ({ ...p, refIngredientUnitId: d.id }));
            }}
            onClear={() => {
              setSelectedIngredientUnit(null);
              setIngredient((p) => ({ ...p, refIngredientUnitId: "" }));
            }}
            getName={getIngredientUnitName}
            fetchOptions={fetchIngredientUnits}
          />

          <Field
            id="estimatedPrice"
            className="w-full"
            label={translations("fields.estimatedPrice")}
            value={String(ingredient.estimatedPrice || "")}
            onChange={(v) =>
              setIngredient((p) => ({ ...p, estimatedPrice: v }))
            }
            placeholder={translations("fields.estimatedPrice")}
          />
          <GeneralAutocomplete<IngredientTypeBase>
            label={translations("fields.ingredientType")}
            translationsKey="Ingredient"
            showShadow={false}
            className="w-full"
            value={selectedIngredientType}
            onSelect={(d) => {
              setSelectedIngredientType(d);
              setIngredient((p) => ({ ...p, refIngredientTypeId: d.id }));
            }}
            onClear={() => {
              setSelectedIngredientType(null);
              setIngredient((p) => ({ ...p, refIngredientTypeId: "" }));
            }}
            getName={getIngredientTypeName}
            fetchOptions={fetchIngredientTypes}
          />
          <Field
            id="quantityLeft"
            className="w-full"
            label={translations("fields.quantityLeft")}
            value={String(quantityLeft || "")}
            onChange={(v) => setQuantityLeft(Number(v))}
            isDisabled={true}
            placeholder={translations("fields.quantityLeft")}
          />

          <div className="flex flex-col justify-center gap-2 py-4 w-full border-t border-white/20">
            <Button
              type="submit"
              disabled={submitting || !isDirty}
              className="h-10 w-full rounded-lg bg-custom-validation-green px-5 text-sm text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:bg-custom-validation-green/90"
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
      </form>

      <div
        className="
            flex flex-col
            gap-5
            w-full
            xl:w-2/3
          "
      >
        <div className="rounded-xl flex-wrap sm:bg-white/10 w-full h-1/4">
          <IngredientStockCreatePage
            onCreated={triggerRefresh}
            ingredientId={ingredient.id}
          />
        </div>
        <div className="rounded-xl flex-wrap sm:bg-white/10 w-full h-3/4">
          <IngredientStockListPage
            ingredientId={ingredient.id}
            refreshKey={stockRefreshKey}
            refreshTrigger={triggerRefresh}
          />
        </div>
      </div>
    </div>
  );
}
