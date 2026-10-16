
import { apiFetch } from "../api-client";
import { BASE_URL } from "../variables";
import type {
  DeleteMealData,
  MealBase,
  MealCreate,
  MealCreateResponse,
  MealIngredientRead,
  MealSearchParams,
  MealSearchResult,
  RecipeBase,
  RecipeCreate,
  RecipeCreateResponse,
  RecipeImageData,
  RecipeRead,
  RecipeSearchParams,
  RecipeSearchResult,
  RecipeUpdateData,
} from "./types";

export function createRecipe(
  body: RecipeCreate,
): Promise<RecipeCreateResponse> {
  return apiFetch<RecipeCreateResponse>(`${BASE_URL}/proxy/recipes`, {
    method: "POST",
    json: body,
  });
}

export function fetchRecipesSearch(
  searchParams: RecipeSearchParams,
): Promise<RecipeSearchResult> {
  const params = new URLSearchParams();

  if (searchParams.name) {
    params.set("name", searchParams.name);
  }
  if (searchParams.maxMakingTime !== undefined) {
    params.set("max_making_time", String(searchParams.maxMakingTime));
  }
  if (searchParams.ingredientIds) {
    for (const id of searchParams.ingredientIds) {
      params.append("ingredient_ids", id);
    }
  }
  if (searchParams.offset !== undefined) {
    params.set("offset", String(searchParams.offset));
  }
  if (searchParams.limit !== undefined) {
    params.set("limit", String(searchParams.limit));
  }

  return apiFetch<RecipeSearchResult>(
    `${BASE_URL}/proxy/recipes?${params.toString()}`,
  );
}

export function fetchRecipeByName(name: string): Promise<RecipeBase[]> {
  const params = new URLSearchParams({ name });

  return apiFetch<RecipeBase[]>(
    `${BASE_URL}/proxy/recipes/select?${params.toString()}`,
  );
}

export function fetchRecipeById(recipeId: string): Promise<RecipeRead> {
  const params = new URLSearchParams({ recipe_id: recipeId });

  return apiFetch<RecipeRead>(
    `${BASE_URL}/proxy/recipes/one?${params.toString()}`,
  );
}

export function updateRecipe(
  body: RecipeUpdateData,
): Promise<RecipeRead> {
  return apiFetch<RecipeRead>(
    `${BASE_URL}/proxy/recipes/update`,
    {
      method: "PATCH",
      json: body,
    },
  );
}

export function setRecipeImage(
  body: RecipeImageData,
): Promise<RecipeRead> {
  return apiFetch<RecipeRead>(
    `${BASE_URL}/proxy/recipes/image`,
    {
      method: "PATCH",
      json: body,
    },
  );
}

export function createMeal(
  body: MealCreate,
): Promise<MealCreateResponse> {
  return apiFetch<MealCreateResponse>(
    `${BASE_URL}/proxy/recipes/meals`,
    {
      method: "POST",
      json: body,
    },
  );
}

export function deleteMeal(body: DeleteMealData): Promise<MealBase> {
  return apiFetch<MealBase>(
    `${BASE_URL}/proxy/recipes/meals/delete`,
    {
      method: "PATCH",
      json: body,
    },
  );
}

export function getMealSetupFromRecipe(
  recipeId: string,
  nbServing: number,
): Promise<MealIngredientRead[]> {
  const params = new URLSearchParams({
    recipe_id: recipeId,
    nb_serving: String(nbServing),
  });

  return apiFetch<MealIngredientRead[]>(
    `${BASE_URL}/proxy/recipes/meals/initial-setup?${params.toString()}`,
  );
}

export function fetchMealSearch(
  searchParams: MealSearchParams,
): Promise<MealSearchResult> {
  const params = new URLSearchParams();

  if (searchParams.recipeName) {
    params.set("recipe_name", searchParams.recipeName);
  }
  if (searchParams.startDate) {
    params.set("start_date", String(searchParams.startDate));
  }
  if (searchParams.endDate) {
    params.set("end_date", String(searchParams.endDate));
  }
  if (searchParams.offset !== undefined) {
    params.set("offset", String(searchParams.offset));
  }
  if (searchParams.limit !== undefined) {
    params.set("limit", String(searchParams.limit));
  }

  return apiFetch<MealSearchResult>(
    `${BASE_URL}/proxy/recipes/meals?${params.toString()}`,
  );
}
