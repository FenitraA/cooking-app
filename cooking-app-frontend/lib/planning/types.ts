
import { CamelCasedPropertiesDeep } from "../case-types";
import type {
  RecipeBaseApiResponse,
  RecipeIngredientReadApiResponse,
} from "../recipe/types";

// Planning recipe

export interface PlanningRecipeBaseApiResponse {
  id: string;
  ref_recipe_id: string;
  ref_household_id: string;
  planning_date: string;
  nb_serving: string;
  description: string;
  state?: number;
}

export type PlanningRecipeBase =
  CamelCasedPropertiesDeep<PlanningRecipeBaseApiResponse>;

export interface PlanningRecipeCreateApiRequest
  extends PlanningRecipeBaseApiResponse {
  planning_dates: string[];
}

export type PlanningRecipeCreate =
  CamelCasedPropertiesDeep<PlanningRecipeCreateApiRequest>;

export interface PlanningRecipeReadApiResponse {
  planning_recipe: PlanningRecipeBaseApiResponse;
  recipe: RecipeBaseApiResponse;
  is_done: boolean;
  estimated_cost_price: number;
  recipe_ingredients: RecipeIngredientReadApiResponse[];
}

export type PlanningRecipeRead =
  CamelCasedPropertiesDeep<PlanningRecipeReadApiResponse>;

// Planning repartition

export interface PlanningRepartitionApiResponse {
  planning_group_date: string;
  day_name: string;
  estimated_cost_price: number;
  planning_recipes: PlanningRecipeReadApiResponse[];
}

export type PlanningRepartition =
  CamelCasedPropertiesDeep<PlanningRepartitionApiResponse>;

// Planning recipe update

export interface PlanningRecipeUpdateDataApiRequest {
  id: string;
  ref_recipe_id: string;
  planning_date: string;
  nb_serving: string;
  description: string;
}

export type PlanningRecipeUpdateData =
  CamelCasedPropertiesDeep<PlanningRecipeUpdateDataApiRequest>;

// Delete planning recipe

export interface DeletePlanningRecipeApiRequest {
  planning_recipe_id: string;
}

export type DeletePlanningRecipeData =
  CamelCasedPropertiesDeep<DeletePlanningRecipeApiRequest>;

// Planning result

export interface PlanningResultApiResponse {
  planning_repartitions: PlanningRepartitionApiResponse[];
  total_estimated_cost_price: number;
  ingredients_to_buy: RecipeIngredientReadApiResponse[];
}

export type PlanningResult =
  CamelCasedPropertiesDeep<PlanningResultApiResponse>;
