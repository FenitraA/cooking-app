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
    <div className="flex flex-col rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-lg overflow-hidden min-w-72 transition-all duration-200 hover:border-white/25">
      {/* Header */}
      <div
        className={`flex flex-row justify-between items-center px-4 py-3.5 text-white ${colorClass}`}
      >
        <span className="font-semibold tracking-tight text-base">{day}</span>
        <span className="text-xs font-medium rounded-full bg-black/20 px-2.5 py-0.5">
          {date}
        </span>
      </div>

      {/* Recipe List */}
      <div className="flex-1 p-3 space-y-2 min-h-40">
        {planningRecipes.length === 0 ? (
          <div className="h-full min-h-32 flex items-center justify-center rounded-xl border border-dashed border-white/15 px-3 text-center text-sm text-gray-400 italic">
            {translations("noRecipePlanned")}
          </div>
        ) : (
          planningRecipes.map((planningRecipe) => (
            <div
              key={planningRecipe.planningRecipe.id}
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(planningRecipe.planningRecipe.id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit(planningRecipe.planningRecipe.id);
                }
              }}
              className="group flex items-center justify-between gap-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 px-3.5 py-2.5 cursor-pointer transition-all duration-150"
            >
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-medium text-white truncate group-hover:translate-x-0.5 transition-transform duration-150">
                  {planningRecipe.recipe.name}
                </span>
                <span className="text-xs font-medium text-custom-money-green mt-0.5">
                  {formatNumberToCurrency(planningRecipe.estimatedCostPrice)}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  title="Servings"
                  className="rounded-full bg-custom-sand-dune/20 border border-custom-sand-dune/35 px-2.5 py-0.5 text-xs font-semibold text-custom-sand-dune"
                >
                  {planningRecipe.planningRecipe.nbServing}
                </span>

                <button
                  type="button"
                  aria-label={`Remove ${planningRecipe.recipe.name}`}
                  className="rounded-full p-1 text-custom-button-red/80 hover:text-custom-button-red hover:bg-red-500/15 transition-colors cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteClick(planningRecipe.planningRecipe.id);
                  }}
                >
                  <CircleX size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Total */}
      <div className="flex items-center justify-between border-t border-white/15 bg-white/3 px-4 py-3 text-sm font-semibold">
        <span className="text-gray-300">Total</span>
        <span className="text-custom-money-green">
          💰 {formatNumberToCurrency(totalPrice)}
        </span>
      </div>
    </div>
  );
}