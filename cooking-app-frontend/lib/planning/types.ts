import { RecipeBase, RecipeIngredientRead } from "../recipe/types";

export interface PlanningRecipeBase {
  id: string;
  ref_recipe_id: string;
  ref_household_id: string;
  planning_date: string;
  nb_serving: string;
  description: string;
  state?: number;
}
export interface PlanningRecipeCreate extends PlanningRecipeBase{
  planning_dates: string[];
}
export interface PlanningRecipeRead {
  planning_recipe: PlanningRecipeBase;
  recipe: RecipeBase;
  is_done: boolean;
  estimated_cost_price: number;
  recipe_ingredients: RecipeIngredientRead[];
}

export interface PlanningRepartition {
  planning_group_date: string;
  day_name: string;
  estimated_cost_price: number;
  planning_recipes: PlanningRecipeRead[];
}
export interface PlanningRecipeUpdateData {
  id: string;
  ref_recipe_id: string;
  planning_date: string;
  nb_serving: string;
  description: string;
}

export interface DeletePlanningRecipeData {
  planning_recipe_id: string;
}
export interface PlanningResult {
  planning_repartitions: PlanningRepartition[];
  total_estimated_cost_price: number;
  ingredients_to_buy: RecipeIngredientRead[];
}
