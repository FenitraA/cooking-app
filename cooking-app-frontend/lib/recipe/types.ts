
import { CamelCasedPropertiesDeep } from "../case-types";

// Recipe ingredients

export interface RecipeIngredientApiResponse {
  id: string; // Local-only ID for table rows
  insertion_id: string;
  ref_ingredient_id: string;
  ingredient_name?: string; // Optional, only for reads
  ingredient_unit?: string; // Optional, only for reads
  ref_recipe_id: string;
  quantity: string;
}

export type RecipeIngredientBase =
  CamelCasedPropertiesDeep<RecipeIngredientApiResponse>;

export interface RecipeIngredientReadApiResponse {
  recipe_ingredient_base: RecipeIngredientApiResponse;
  recipe_name: string;
  ingredient_name: string;
  ingredient_unit: string;
  estimated_cost_per_unit: number;
}

export type RecipeIngredientRead =
  CamelCasedPropertiesDeep<RecipeIngredientReadApiResponse>;

// Recipes

export interface RecipeSearchParamsApi {
  name?: string;
  max_making_time?: string;
  ingredient_ids?: string[];
  offset?: number;
  limit?: number;
}

export type RecipeSearchParams =
  CamelCasedPropertiesDeep<RecipeSearchParamsApi>;

export interface RecipeBaseApiResponse {
  id: string;
  name: string;
  ref_household_id: string;
  description: string;
  estimated_time: string;
  parallel_cooking: string;
  image_url: string | null;
  storage_key: string | null;
}

export type RecipeBase =
  CamelCasedPropertiesDeep<RecipeBaseApiResponse>;

export interface RecipeImageDataApiResponse {
  id: string;
  image_url: string;
  storage_key: string;
}

export type RecipeImageData =
  CamelCasedPropertiesDeep<RecipeImageDataApiResponse>;

export interface RecipeCreateApiRequest extends RecipeBaseApiResponse {
  recipe_ingredients: RecipeIngredientApiResponse[];
}

export type RecipeCreate =
  CamelCasedPropertiesDeep<RecipeCreateApiRequest>;

export interface RecipeCreateResponseApiResponse {
  recipe: RecipeBaseApiResponse;
  recipe_ingredients: RecipeIngredientApiResponse[];
}

export type RecipeCreateResponse =
  CamelCasedPropertiesDeep<RecipeCreateResponseApiResponse>;

export interface RecipeReadApiResponse {
  recipe: RecipeBaseApiResponse;
  estimated_cost_price: number;
  recipe_ingredients: RecipeIngredientReadApiResponse[];
}

export type RecipeRead =
  CamelCasedPropertiesDeep<RecipeReadApiResponse>;

export interface RecipeSearchResultApiResponse {
  items: RecipeReadApiResponse[];
  total: number;
  offset: number;
  limit: number;
}

export type RecipeSearchResult =
  CamelCasedPropertiesDeep<RecipeSearchResultApiResponse>;

export interface RecipeUpdateDataApiRequest {
  id: string;
  name: string;
  description: string;
  estimated_time: string;
  parallel_cooking: string;
  recipe_ingredients: RecipeIngredientApiResponse[];
}

export type RecipeUpdateData =
  CamelCasedPropertiesDeep<RecipeUpdateDataApiRequest>;

// Meal ingredients

export interface MealIngredientApiResponse {
  id: string; // Local-only ID for table rows
  ref_meal_id: string;
  ref_ingredient_unit_id: string;
  ref_ingredient_stock_id: string;
  ingredient_name?: string; // Optional, only for reads
  ingredient_unit?: string; // Optional, only for reads
  stock_description?: string; // Optional, only for reads
  total_price?: string; // Optional, only for reads
  quantity: string;
}

export type MealIngredientBase =
  CamelCasedPropertiesDeep<MealIngredientApiResponse>;

export interface MealIngredientReadApiResponse {
  meal_ingredient_base: MealIngredientApiResponse;
  seller_name: string;
  ingredient_name: string;
  ingredient_unit: string;
  unit_cost: number;
  total_price: number;
}

export type MealIngredientRead =
  CamelCasedPropertiesDeep<MealIngredientReadApiResponse>;

// Meals

export interface MealSearchParamsApi {
  recipe_name?: string;
  start_date?: string;
  end_date?: string;
  offset?: number;
  limit?: number;
}

export type MealSearchParams =
  CamelCasedPropertiesDeep<MealSearchParamsApi>;

export interface MealBaseApiResponse {
  id: string;
  ref_recipe_id: string;
  nb_serving: string;
  created_at?: Date;
}

export type MealBase =
  CamelCasedPropertiesDeep<MealBaseApiResponse>;

export interface MealCreateApiRequest extends MealBaseApiResponse {
  meal_ingredients: MealIngredientApiResponse[];
}

export type MealCreate =
  CamelCasedPropertiesDeep<MealCreateApiRequest>;

export interface MealCreateResponseApiResponse {
  meal: MealBaseApiResponse;
  meal_ingredients: MealIngredientApiResponse[];
}

export type MealCreateResponse =
  CamelCasedPropertiesDeep<MealCreateResponseApiResponse>;

export interface MealReadApiResponse {
  meal: MealBaseApiResponse;
  recipe_name: string;
  total_cost_price: number;
  total_estimated_time: number;
  meal_ingredients: MealIngredientReadApiResponse[];
}

export type MealRead =
  CamelCasedPropertiesDeep<MealReadApiResponse>;

export interface MealSearchResultApiResponse {
  items: MealReadApiResponse[];
  total: number;
  offset: number;
  limit: number;
}

export type MealSearchResult =
  CamelCasedPropertiesDeep<MealSearchResultApiResponse>;

export interface DeleteMealApiRequest {
  meal_id: string;
}

export type DeleteMealData =
  CamelCasedPropertiesDeep<DeleteMealApiRequest>;
