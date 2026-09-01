import { UnauthorizedError } from "../errors";
import { safeReadError } from "../utils";
import { BASE_URL } from "../variables";
import {
  DeletePlanningRecipeData,
  PlanningRecipeBase,
  PlanningRecipeCreate,
  PlanningRecipeRead,
  PlanningRecipeUpdateData,
  PlanningResult,
} from "./types";

export async function createPlanningRecipe(
  body: PlanningRecipeCreate,
): Promise<PlanningRecipeBase[]> {
  const res = await fetch(`${BASE_URL}/proxy/planning`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.status === 401) {
    throw new UnauthorizedError();
  }

  if (!res.ok) {
    const msg = await safeReadError(res);
    throw new Error(msg || "Failed to create planning recipe.");
  }

  const planning_recipes = (await res.json()) as PlanningRecipeBase[];
  return planning_recipes;
}

export async function fetchWeeklyPlanning(
  planning_date: string,
): Promise<PlanningResult> {
  const res = await fetch(
    `${BASE_URL}/proxy/planning/weekly?planning_date=${encodeURIComponent(planning_date)}`,
  );

  if (res.status === 401) {
    throw new UnauthorizedError();
  }

  if (!res.ok) {
    const msg = await safeReadError(res);
    throw new Error(msg || "Failed to fetch weekly planning");
  }

  const planning = (await res.json()) as PlanningResult;
  return planning;
}

export async function fetchPlanningByDate(
  start_date: string,
  end_date: string,
): Promise<PlanningResult> {
  const res = await fetch(
    `${BASE_URL}/proxy/planning/by-dates?start_date=${encodeURIComponent(start_date)}&end_date=${encodeURIComponent(end_date)}`,
  );

  if (res.status === 401) {
    throw new UnauthorizedError();
  }

  if (!res.ok) {
    const msg = await safeReadError(res);
    throw new Error(msg || "Failed to fetch planning");
  }

  const planning = (await res.json()) as PlanningResult;
  return planning;
}

export async function fetchPlanning(
  today_date: string,
): Promise<PlanningResult> {
  const res = await fetch(
    `${BASE_URL}/proxy/planning?today_date=${encodeURIComponent(today_date)}`,
  );

  if (res.status === 401) {
    throw new UnauthorizedError();
  }

  if (!res.ok) {
    const msg = await safeReadError(res);
    throw new Error(msg || "Failed to fetch weekly planning");
  }

  const planning = (await res.json()) as PlanningResult;
  return planning;
}

export async function fetchRecipeById(planning_recipe_id: string): Promise<PlanningRecipeRead> {
  const res = await fetch(
    `${BASE_URL}/proxy/planning/one?planning_recipe_id=${encodeURIComponent(planning_recipe_id)}`,
  );

  if (res.status === 401) {
    throw new UnauthorizedError();
  }

  if (!res.ok) {
    const msg = await safeReadError(res);
    throw new Error(msg || "Failed to fetch planning_recipe");
  }

  const planning_recipe = (await res.json()) as PlanningRecipeRead;
  return planning_recipe;
}

export async function deletePlanningRecipe(
  body: DeletePlanningRecipeData,
): Promise<PlanningRecipeBase> {
  const res = await fetch(`${BASE_URL}/proxy/planning/delete`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (res.status === 401) throw new UnauthorizedError("Unauthorized");
  if (!res.ok) throw new Error(await res.text().catch(() => "Request failed"));

  const planning_recipe = (await res.json()) as PlanningRecipeBase;
  return planning_recipe;
}

export async function updatePlanningRecipe(
  body: PlanningRecipeUpdateData,
): Promise<PlanningRecipeRead> {
  const res = await fetch(`${BASE_URL}/proxy/planning/update`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (res.status === 401) throw new UnauthorizedError("Unauthorized");
  if (!res.ok) throw new Error(await res.text().catch(() => "Request failed"));

  const planning_recipe = (await res.json()) as PlanningRecipeRead;
  return planning_recipe;
}
