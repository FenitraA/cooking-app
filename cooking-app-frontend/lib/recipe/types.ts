//Recipe ingredients
export interface RecipeIngredientBase {
  id: string; // local-only id for table rows
  insertion_id: string;
  ref_ingredient_id: string;
  ingredient_name?: string; // optional, only for reads
  ingredient_unit?: string; // optional, only for reads
  ref_recipe_id: string;
  quantity: string;
}
export interface RecipeIngredientRead {
  recipe_ingredient_base: RecipeIngredientBase;
  recipe_name: string;
  ingredient_name: string;
  ingredient_unit: string;
  estimated_cost_per_unit: number;
}

//Recipes
export interface RecipeSearchParams {
  name?: string;
  max_making_time?: string;
  ingredient_ids?: string[];
  offset?: number;
  limit?: number;
}
export interface RecipeBase {
  id: string;
  name: string;
  ref_household_id: string;
  description: string;
  estimated_time: string;
  parallel_cooking: string;
  image_url : string | null;
  storage_key : string | null;
}
export interface RecipeImageData {
  id:string;
  image_url: string;
  storage_key: string;
}
export interface RecipeCreate extends RecipeBase {
  recipe_ingredients: RecipeIngredientBase[];
}
export interface RecipeCreateResponse {
  recipe: RecipeBase;
  recipe_ingredients: RecipeIngredientBase[];
}
export interface RecipeRead {
  recipe: RecipeBase;
  estimated_cost_price: number;
  recipe_ingredients: RecipeIngredientRead[];
}
export interface RecipeSearchResult {
  items: RecipeRead[];
  total: number;
  offset: number;
  limit: number;
}
export interface RecipeUpdateData {
  id: string;
  name: string;
  description: string;
  estimated_time: string;
  parallel_cooking: string;
  recipe_ingredients: RecipeIngredientBase[];
}

//Meal ingredients
export interface MealIngredientBase {
  id: string; // local-only id for table rows
  ref_meal_id: string;
  ref_ingredient_unit_id: string;
  ref_ingredient_stock_id: string;
  ingredient_name?: string; // optional, only for reads
  ingredient_unit?: string; // optional, only for reads
  stock_description?: string; // optional, only for reads
  total_price?: string; // optional, only for reads
  quantity: string;
}
export interface MealIngredientRead {
  meal_ingredient_base: MealIngredientBase;
  seller_name: string;
  ingredient_name: string;
  ingredient_unit: string;
  unit_cost: number;
  total_price: number;
}

//Meal
export interface MealSearchParams {
  recipe_name?: string;
  start_date?: string;
  end_date?: string;
  offset?: number;
  limit?: number;
}
export interface MealBase {
  id: string;
  ref_recipe_id: string;
  nb_serving: string;
  created_at?: Date;
}
export interface MealCreate extends MealBase {
  meal_ingredients: MealIngredientBase[];
}
export interface MealCreateResponse {
  meal: MealBase;
  meal_ingredients: MealIngredientBase[];
}
export interface MealRead {
  meal: MealBase;
  recipe_name: string;
  total_cost_price: number;
  total_estimated_time: number;
  meal_ingredients: MealIngredientRead[];
}
export interface MealSearchResult {
  items: MealRead[];
  total: number;
  offset: number;
  limit: number;
}
export interface DeleteMealData {
  meal_id: string;
}
