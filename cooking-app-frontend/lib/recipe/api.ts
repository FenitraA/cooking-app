import { UnauthorizedError } from "../errors";
import { safeReadError } from "../utils";
import { BASE_URL } from "../variables";
import {
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

export async function createRecipe(
  body: RecipeCreate,
): Promise<RecipeCreateResponse> {
  const res = await fetch(`${BASE_URL}/proxy/recipes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.status === 401) {
    throw new UnauthorizedError();
  }

  if (!res.ok) {
    const msg = await safeReadError(res);
    throw new Error(msg || "Failed to create recipe.");
  }

  const recipe = (await res.json()) as RecipeCreateResponse;
  return recipe;
}

export async function fetchRecipesSearch(
  searchParams: RecipeSearchParams,
): Promise<RecipeSearchResult> {
  const params = new URLSearchParams();

  if (searchParams.name) {
    params.set("name", searchParams.name);
  }
  if (searchParams.max_making_time) {
    params.set("max_making_time", String(searchParams.max_making_time));
  }
  if (searchParams.ingredient_ids) {
    for (const id of searchParams.ingredient_ids) {
      params.append("ingredient_ids", id);
    }
  }
  if (searchParams.offset !== undefined) {
    params.set("offset", String(searchParams.offset));
  }
  if (searchParams.limit !== undefined) {
    params.set("limit", String(searchParams.limit));
  }

  const res = await fetch(`${BASE_URL}/proxy/recipes?${params.toString()}`);

  if (res.status === 401) {
    throw new UnauthorizedError();
  }

  if (!res.ok) {
    const msg = await safeReadError(res);
    throw new Error(msg || "Failed to fetch recipes.");
  }

  const data = (await res.json()) as RecipeSearchResult;
  return data;
}

export async function fetchRecipeByName(name: string): Promise<RecipeBase[]> {
  const res = await fetch(
    `${BASE_URL}/proxy/recipes/select?name=${encodeURIComponent(name)}`,
  );

  if (res.status === 401) {
    throw new UnauthorizedError();
  }

  if (!res.ok) {
    const msg = await safeReadError(res);
    throw new Error(msg || "Failed to fetch recipes");
  }

  const recipes = (await res.json()) as RecipeBase[];
  return recipes;
}

export async function fetchRecipeById(recipe_id: string): Promise<RecipeRead> {
  const res = await fetch(
    `${BASE_URL}/proxy/recipes/one?recipe_id=${encodeURIComponent(recipe_id)}`,
  );

  if (res.status === 401) {
    throw new UnauthorizedError();
  }

  if (!res.ok) {
    const msg = await safeReadError(res);
    throw new Error(msg || "Failed to fetch recipe");
  }

  const recipe = (await res.json()) as RecipeRead;
  return recipe;
}

export async function updateRecipe(
  body: RecipeUpdateData,
): Promise<RecipeRead> {
  const res = await fetch(`${BASE_URL}/proxy/recipes/update`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (res.status === 401) throw new UnauthorizedError("Unauthorized");
  if (!res.ok) throw new Error(await res.text().catch(() => "Request failed"));

  const recipe = (await res.json()) as RecipeRead;
  return recipe;
}

export async function setRecipeImage(
  body: RecipeImageData,
): Promise<RecipeRead> {
  const res = await fetch(`${BASE_URL}/proxy/recipes/image`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (res.status === 401) throw new UnauthorizedError("Unauthorized");
  if (!res.ok) throw new Error(await res.text().catch(() => "Request failed"));

  const recipe = (await res.json()) as RecipeRead;
  return recipe;
}

export async function createMeal(
  body: MealCreate,
): Promise<MealCreateResponse> {
  const res = await fetch(`${BASE_URL}/proxy/recipes/meals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.status === 401) {
    throw new UnauthorizedError();
  }

  if (!res.ok) {
    const msg = await safeReadError(res);
    throw new Error(msg || "Failed to create meal.");
  }

  const meal = (await res.json()) as MealCreateResponse;
  return meal;
}

export async function deleteMeal(body: DeleteMealData): Promise<MealBase> {
  const res = await fetch(`${BASE_URL}/proxy/recipes/meals/delete`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (res.status === 401) throw new UnauthorizedError("Unauthorized");
  if (!res.ok) throw new Error(await res.text().catch(() => "Request failed"));

  const meal = (await res.json()) as MealBase;
  return meal;
}

export async function getMealSetupFromRecipe(
  recipe_id: string,
  nb_serving: number,
): Promise<MealIngredientRead[]> {
  const res = await fetch(
    `${BASE_URL}/proxy/recipes/meals/initial-setup?recipe_id=${encodeURIComponent(recipe_id)}&nb_serving=${encodeURIComponent(nb_serving)}`,
  );

  if (res.status === 401) {
    throw new UnauthorizedError();
  }

  if (!res.ok) {
    const msg = await safeReadError(res);
    throw new Error(msg || "Failed to fetch meal setup");
  }

  const recipe = (await res.json()) as MealIngredientRead[];
  return recipe;
}

export async function fetchMealSearch(
  searchParams: MealSearchParams,
): Promise<MealSearchResult> {
  const params = new URLSearchParams();

  if (searchParams.recipe_name) {
    params.set("recipe_name", searchParams.recipe_name);
  }
  if (searchParams.start_date) {
    params.set("start_date", String(searchParams.start_date));
  }
  if (searchParams.end_date) {
    params.set("end_date", String(searchParams.end_date));
  }
  if (searchParams.offset !== undefined) {
    params.set("offset", String(searchParams.offset));
  }
  if (searchParams.limit !== undefined) {
    params.set("limit", String(searchParams.limit));
  }

  const res = await fetch(`${BASE_URL}/proxy/recipes/meals?${params.toString()}`);

  if (res.status === 401) {
    throw new UnauthorizedError();
  }

  if (!res.ok) {
    const msg = await safeReadError(res);
    throw new Error(msg || "Failed to fetch meals.");
  }

  const data = (await res.json()) as MealSearchResult;
  return data;
}
