"use client";

import CustomAccordion from "@/components/forms/CustomAccordion";
import SafeImage from "@/components/forms/SafeImage";
import { RecipeRead } from "@/lib/recipe/types";
import { formatNumber, formatNumberToCurrency } from "@/lib/utils";
import { CookingPot, SquarePen } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export type RecipeCardProps = {
  data: RecipeRead;
  onEdit: () => void;
  onImageClick?: (imageUrl: string) => void;
};

export default function RecipeCard({
  data,
  onEdit,
  onImageClick,
}: RecipeCardProps) {
  const router = useRouter();

  const translations = useTranslations("Recipe");

  return (
    <CustomAccordion
      title={
        <div className="flex w-full flex-col sm:flex-row sm:items-center gap-4">
          <div
            className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 border-custom-sand-dune cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onImageClick?.(
                data.recipe.imageUrl ?? "/images/recipe_placeholder.jpg",
              );
            }}
          >
            <SafeImage
              src={data.recipe.imageUrl ?? "/images/recipe_placeholder.jpg"}
              alt={data.recipe.name}
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>

          <div className="flex flex-1 flex-col text-left">
            <div className="flex flex-row gap-3 justify-between sm:justify-start items-center">
              <span className="text-lg font-bold text-custom-sand-dune">
                {data.recipe.name}
              </span>
              <div className="flex gap-4">
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  <SquarePen
                    size={16}
                    className="cursor-pointer text-gray-300"
                  />
                </span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/recipe/meal?idRecipe=${data.recipe.id}`);
                  }}
                >
                  <CookingPot
                    size={16}
                    className="cursor-pointer text-gray-300"
                  />
                </span>
              </div>
            </div>

            <span className="text-sm text-white/70">
              {data.recipeIngredients.length} ingredients
            </span>

            <div className="mt-2 flex flex-wrap gap-3 text-sm">
              <span>⏱ {data.recipe.estimatedTime} min</span>

              <span className="text-custom-money-green font-semibold">
                💰 {formatNumberToCurrency(data.estimatedCostPrice)}
              </span>

              {Number(data.recipe.parallelCooking) > 0 && (
                <span>🍳 {data.recipe.parallelCooking} stations</span>
              )}
            </div>
          </div>
        </div>
      }
    >
      <div className="flex flex-col lg:flex-row gap-6 text-gray-300">
        {/* Ingredients */}
        <div className="w-full lg:w-1/2">
          <header className="mb-2 px-2 py-2 border-b border-custom-sand-dune">
            <h2 className="text-md font-semibold text-custom-sand-dune tracking-tight">
              {translations("fields.ingredients")}
            </h2>
          </header>

          <div className="space-y-2">
            {data.recipeIngredients.map((ingredient) => (
              <div
                key={ingredient.ingredientName}
                className="
                  flex
                  bg-white/10
                  flex-col
                  p-3
                  sm:flex-row
                  sm:justify-between
                  gap-2
                  flex-1
                "
              >
                <span className="font-semibold">
                  {ingredient.ingredientName}
                </span>

                <span className="font-medium text-sm">
                  <span className="text-custom-sand-dune">
                    {formatNumber(
                      ingredient.recipeIngredientBase.quantity,
                    )}
                  </span>{" "}
                  <span className="text-custom-sand-dune">
                    {ingredient.ingredientUnit}
                  </span>
                  <span className="ml-2 text-custom-money-green font-semibold">
                    {formatNumberToCurrency(
                      ingredient.estimatedCostPerUnit *
                        Number(ingredient.recipeIngredientBase.quantity),
                    )}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="w-full lg:w-1/2">
          <header className="mb-2 px-2 py-2 border-b border-custom-sand-dune">
            <h2 className="text-md font-semibold text-custom-sand-dune tracking-tight">
              {translations("fields.description")}
            </h2>
          </header>

          <div
            className="
                  rounded-xl
                   bg-white/10
                  p-4
                  whitespace-pre-wrap
                "
          >
            {data.recipe.description || (
              <span className="text-gray-500">
                {translations("fields.noDescription")}
              </span>
            )}
          </div>
        </div>
      </div>
    </CustomAccordion>
  );
}
