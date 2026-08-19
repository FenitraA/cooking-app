import { memo } from "react";
import SafeImage from "@/components/forms/SafeImage";
import { formatNumber, formatNumberToCurrency } from "@/lib/utils";
import { useTranslations } from "next-intl";

export type IngredientCardProps = {
  ingredientId: string;
  name: string;
  imageUrl?: string | null;
  unit: string;
  estimatedPrice: number;
  quantityLeft: number;
  ingredientType?: string;
  onImageClick?: (imageUrl: string) => void;
};

function IngredientCard({
  ingredientId,
  name,
  imageUrl,
  unit,
  estimatedPrice,
  quantityLeft,
  ingredientType,
  onImageClick,
}: IngredientCardProps) {
  const general_translations = useTranslations("General");

  return (
    <div
      className="
        relative
        mt-10
        rounded-3xl
        bg-custom-dark-blue
        border
        border-custom-sand-dune/50
        px-4
        pb-4
        pt-16
        text-white
        hover:scale-[1.02]
        transition-transform
        cursor-pointer
      "
    >
      {/* Thumbnail */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2">
        <div
          className="relative h-18 w-18 sm:h-22 sm:w-22 overflow-hidden rounded-xl border-2 border-custom-sand-dune/50 shadow-md"
          onClick={(e) => {
            e.stopPropagation();
            onImageClick?.(imageUrl ?? "/images/ingredient_placeholder.jpg");
          }}
        >
          <SafeImage
            src={imageUrl ?? "/images/ingredient_placeholder.jpg"}
            alt={`ingredient-image-${ingredientId}`}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover rounded-xl bg-custom-dark-blue"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col items-center text-center w-full">
        <h3 className="font-semibold text-lg text-white line-clamp-1">
          {name}
        </h3>

        <div className="w-12 h-0.5 bg-custom-sand-dune rounded-full mt-1 mb-3" />

        <div className="w-full space-y-2">
          <div className="flex justify-between items-center rounded-lg bg-white/5 px-3 py-2">
            <span className="text-xs uppercase tracking-wide text-gray-400">
              {general_translations("price")}
            </span>
            <span className="text-xs font-semibold text-custom-money-green">
              {formatNumberToCurrency(estimatedPrice)}
              <span className="text-gray-400 ml-1">/ {unit}</span>
            </span>
          </div>

          <div className="flex justify-between items-center rounded-lg bg-white/5 px-3 py-2">
            <span className="text-xs uppercase tracking-wide text-gray-400">
              {general_translations("stock")}
            </span>
            <span className="text-xs font-semibold text-custom-sand-dune">
              {formatNumber(quantityLeft)}
              <span className="text-gray-400 ml-1">{unit}</span>
            </span>
          </div>
        </div>

        {ingredientType && (
          <div className="mt-3 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
            {ingredientType}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(IngredientCard);
