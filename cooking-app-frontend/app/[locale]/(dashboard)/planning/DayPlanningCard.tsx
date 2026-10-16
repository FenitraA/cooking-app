import { PlanningRecipeRead } from "@/lib/planning/types";
import { formatNumberToCurrency } from "@/lib/utils";
import { CircleX } from "lucide-react";
import { useTranslations } from "next-intl";

type DayPlanningCardProps = {
  day: string;
  date: string;
  totalPrice: number;
  planningRecipes: PlanningRecipeRead[];
  colorClass: string;
  onDeleteClick: (planningRecipeId: string) => void;
  onEdit: (planningRecipeId: string) => void;
};

export default function DayPlanningCard({
  day,
  date,
  totalPrice,
  planningRecipes,
  colorClass,
  onDeleteClick,
  onEdit,
}: DayPlanningCardProps) {
  const translations = useTranslations("Planning");
  return (
    <div className="bg-white/10 border border-white/20 shadow-hard-br overflow-hidden min-w-70">
      <div
        className={`flex flex-row  justify-between items-center px-4 py-3 text-white ${colorClass}`}
      >
        <span className="font-semibold">{day}</span>
        <span className="text-xs underline">{date}</span>
      </div>

      <div className="p-3 space-y-2 min-h-40">
        {planningRecipes.length === 0 ? (
          <div className="text-sm text-gray-400 italic">
            {translations("noRecipePlanned")}
          </div>
        ) : (
          planningRecipes.map((planningRecipe) => (
            <div
              key={planningRecipe.planningRecipe.id}
              className="relative flex items-center gap-4 rounded-lg bg-white/5 px-3 py-2 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(planningRecipe.planningRecipe.id);
              }}
            >
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-white truncate">
                  {planningRecipe.recipe.name}
                </span>

                <span className="text-xs text-custom-money-green">
                  {formatNumberToCurrency(planningRecipe.estimatedCostPrice)}
                </span>
              </div>

              <span
                className="
                  rounded-full
                  bg-custom-sand-dune/20
                  border border-custom-sand-dune/30
                  px-2 py-1
                  text-xs font-semibold
                  text-custom-sand-dune
                  transition-all duration-200
                  group-hover:mr-16
                "
              >
                {planningRecipe.planningRecipe.nbServing}
              </span>

              <div
                className="
                  flex
                  flex-row
                  gap-3
                "
              >
                <CircleX
                  size={16}
                  className="cursor-pointer text-custom-button-red hover:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteClick(planningRecipe.planningRecipe.id);
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>
      <div className="font-semibold border-t border-white/20 py-2 text-custom-money-green w-5/6 mx-auto">
        💰 {formatNumberToCurrency(totalPrice)}
      </div>
    </div>
  );
}
