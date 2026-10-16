
import { apiFetch } from "../api-client";
import { BASE_URL } from "../variables";
import type {
  DeleteIngredientStockData,
  IngredientBase,
  IngredientImageData,
  IngredientRead,
  IngredientSearchParams,
  IngredientSearchResult,
  IngredientStockBase,
  IngredientStockRead,
  IngredientTypeBase,
  IngredientUnitBase,
  IngredientUpdateData,
  SellerBase,
} from "./types";

export function createIngredient(
  body: IngredientBase,
): Promise<IngredientBase> {
  return apiFetch<IngredientBase>(
    `${BASE_URL}/proxy/ingredients`,
    {
      method: "POST",
      json: body,
    },
  );
}

export function fetchIngredientsSearch(
  searchParams: IngredientSearchParams,
): Promise<IngredientSearchResult> {
  const params = new URLSearchParams();

  if (searchParams.name) {
    params.set("name", searchParams.name);
  }
  if (searchParams.typeId) {
    params.set("type_id", searchParams.typeId);
  }
  if (searchParams.minStock !== undefined) {
    params.set("min_stock", String(searchParams.minStock));
  }
  if (searchParams.sortBy) {
    params.set("sort_by", searchParams.sortBy);
  }
  if (searchParams.sortDirection) {
    params.set("sort_direction", searchParams.sortDirection);
  }
  if (searchParams.offset !== undefined) {
    params.set("offset", String(searchParams.offset));
  }
  if (searchParams.limit !== undefined) {
    params.set("limit", String(searchParams.limit));
  }

  return apiFetch<IngredientSearchResult>(
    `${BASE_URL}/proxy/ingredients?${params.toString()}`,
  );
}

export function fetchIngredientTypes(
  name: string,
): Promise<IngredientTypeBase[]> {
  const params = new URLSearchParams({ name });

  return apiFetch<IngredientTypeBase[]>(
    `${BASE_URL}/proxy/ingredients/types?${params.toString()}`,
  );
}

export function fetchIngredientUnits(
  name: string,
): Promise<IngredientUnitBase[]> {
  const params = new URLSearchParams({ name });

  return apiFetch<IngredientUnitBase[]>(
    `${BASE_URL}/proxy/ingredients/units?${params.toString()}`,
  );
}

export function fetchIngredientById(
  ingredientId: string,
): Promise<IngredientRead> {
  const params = new URLSearchParams({
    ingredient_id: ingredientId,
  });

  return apiFetch<IngredientRead>(
    `${BASE_URL}/proxy/ingredients/one?${params.toString()}`,
  );
}

export function updateIngredient(
  body: IngredientUpdateData,
): Promise<IngredientRead> {
  return apiFetch<IngredientRead>(
    `${BASE_URL}/proxy/ingredients/update`,
    {
      method: "PATCH",
      json: body,
    },
  );
}

export function setIngredientImage(
  body: IngredientImageData,
): Promise<IngredientRead> {
  return apiFetch<IngredientRead>(
    `${BASE_URL}/proxy/ingredients/image`,
    {
      method: "PATCH",
      json: body,
    },
  );
}

export function fetchIngredientStocks(
  ingredientId: string,
): Promise<IngredientStockRead[]> {
  const params = new URLSearchParams({
    ingredient_id: ingredientId,
  });

  return apiFetch<IngredientStockRead[]>(
    `${BASE_URL}/proxy/ingredients/stocks?${params.toString()}`,
  );
}

export function createStock(
  body: IngredientStockBase,
): Promise<IngredientStockBase> {
  return apiFetch<IngredientStockBase>(
    `${BASE_URL}/proxy/ingredients/stocks`,
    {
      method: "POST",
      json: body,
    },
  );
}

export function deleteIngredientStock(
  body: DeleteIngredientStockData,
): Promise<IngredientStockBase> {
  return apiFetch<IngredientStockBase>(
    `${BASE_URL}/proxy/ingredients/stocks/delete`,
    {
      method: "PATCH",
      json: body,
    },
  );
}

export function fetchSellers(name: string): Promise<SellerBase[]> {
  const params = new URLSearchParams({ name });

  return apiFetch<SellerBase[]>(
    `${BASE_URL}/proxy/ingredients/sellers?${params.toString()}`,
  );
}

export function fetchIngredientByName(
  name: string,
): Promise<IngredientBase[]> {
  const params = new URLSearchParams({ name });

  return apiFetch<IngredientBase[]>(
    `${BASE_URL}/proxy/ingredients/select?${params.toString()}`,
  );
}
