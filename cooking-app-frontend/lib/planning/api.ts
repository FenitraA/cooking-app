
import { apiFetch } from "../api-client";
import { BASE_URL } from "../variables";
import type {
  DeletePlanningRecipeData,
  PlanningRecipeBase,
  PlanningRecipeCreate,
  PlanningRecipeRead,
  PlanningRecipeUpdateData,
  PlanningResult,
} from "./types";

export function createPlanningRecipe(
  body: PlanningRecipeCreate,
): Promise<PlanningRecipeBase[]> {
  return apiFetch<PlanningRecipeBase[]>(`${BASE_URL}/proxy/planning`, {
    method: "POST",
    json: body,
  });
}

export function fetchWeeklyPlanning(
  planningDate: string,
): Promise<PlanningResult> {
  const params = new URLSearchParams({
    planning_date: planningDate,
  });

  return apiFetch<PlanningResult>(
    `${BASE_URL}/proxy/planning/weekly?${params.toString()}`,
  );
}

export function fetchPlanningByDate(
  startDate: string,
  endDate: string,
): Promise<PlanningResult> {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  });

  return apiFetch<PlanningResult>(
    `${BASE_URL}/proxy/planning/by-dates?${params.toString()}`,
  );
}

export function fetchPlanning(
  todayDate: string,
): Promise<PlanningResult> {
  const params = new URLSearchParams({
    today_date: todayDate,
  });

  return apiFetch<PlanningResult>(
    `${BASE_URL}/proxy/planning?${params.toString()}`,
  );
}

export function fetchRecipeById(
  planningRecipeId: string,
): Promise<PlanningRecipeRead> {
  const params = new URLSearchParams({
    planning_recipe_id: planningRecipeId,
  });

  return apiFetch<PlanningRecipeRead>(
    `${BASE_URL}/proxy/planning/one?${params.toString()}`,
  );
}

export function deletePlanningRecipe(
  body: DeletePlanningRecipeData,
): Promise<PlanningRecipeBase> {
  return apiFetch<PlanningRecipeBase>(
    `${BASE_URL}/proxy/planning/delete`,
    {
      method: "PATCH",
      json: body,
    },
  );
}

export function updatePlanningRecipe(
  body: PlanningRecipeUpdateData,
): Promise<PlanningRecipeRead> {
  return apiFetch<PlanningRecipeRead>(
    `${BASE_URL}/proxy/planning/update`,
    {
      method: "PATCH",
      json: body,
    },
  );
}
