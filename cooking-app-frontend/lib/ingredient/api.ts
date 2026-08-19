import { UnauthorizedError } from "../errors";
import { safeReadError } from "../utils";
import { BASE_URL } from "../variables";
import {
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

export async function createIngredient(
  body: IngredientBase,
): Promise<IngredientBase> {
  const res = await fetch(`${BASE_URL}/proxy/ingredients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.status === 401) {
    throw new UnauthorizedError();
  }

  if (!res.ok) {
    const msg = await safeReadError(res);
    throw new Error(msg || "Failed to create ingredient.");
  }

  const ingredient = (await res.json()) as IngredientBase;
  return ingredient;
}

export async function fetchIngredientsSearch(
  searchParams: IngredientSearchParams,
): Promise<IngredientSearchResult> {
  const params = new URLSearchParams();

  if (searchParams.name) {
    params.set("name", searchParams.name);
  }
  if (searchParams.type_id) {
    params.set("type_id", searchParams.type_id);
  }
  if (searchParams.min_stock !== undefined) {
    params.set("min_stock", String(searchParams.min_stock));
  }
  if (searchParams.sort_by) {
    params.set("sort_by", searchParams.sort_by);
  }
  if (searchParams.sort_direction) {
    params.set("sort_direction", searchParams.sort_direction);
  }
  if (searchParams.offset !== undefined) {
    params.set("offset", String(searchParams.offset));
  }
  if (searchParams.limit !== undefined) {
    params.set("limit", String(searchParams.limit));
  }

  const res = await fetch(`${BASE_URL}/proxy/ingredients?${params.toString()}`);

  if (res.status === 401) {
    throw new UnauthorizedError();
  }

  if (!res.ok) {
    const msg = await safeReadError(res);
    throw new Error(msg || "Failed to fetch ingredients.");
  }

  const data = await res.json() as IngredientSearchResult;
  return data;
}

export async function fetchIngredientTypes(
  name: string,
): Promise<IngredientTypeBase[]> {
  const res = await fetch(
    `${BASE_URL}/proxy/ingredients/types?name=${encodeURIComponent(name)}`,
  );

  if (res.status === 401) {
    throw new UnauthorizedError();
  }

  if (!res.ok) {
    const msg = await safeReadError(res);
    throw new Error(msg || "Failed to fetch ingredient types");
  }

  const ingredientTypes = (await res.json()) as IngredientTypeBase[];
  return ingredientTypes;
}

export async function fetchIngredientUnits(
  name: string,
): Promise<IngredientUnitBase[]> {
  const res = await fetch(
    `${BASE_URL}/proxy/ingredients/units?name=${encodeURIComponent(name)}`,
  );

  if (res.status === 401) {
    throw new UnauthorizedError();
  }

  if (!res.ok) {
    const msg = await safeReadError(res);
    throw new Error(msg || "Failed to fetch ingredient units");
  }

  const ingredientUnits = (await res.json()) as IngredientUnitBase[];
  return ingredientUnits;
}

export async function fetchIngredientById(
  ingredient_id: string,
): Promise<IngredientRead> {
  const res = await fetch(
    `${BASE_URL}/proxy/ingredients/one?ingredient_id=${encodeURIComponent(ingredient_id)}`,
  );

  if (res.status === 401) {
    throw new UnauthorizedError();
  }

  if (!res.ok) {
    const msg = await safeReadError(res);
    throw new Error(msg || "Failed to fetch ingredient");
  }

  const ingredient = (await res.json()) as IngredientRead;
  return ingredient;
}

export async function updateIngredient(
  body: IngredientUpdateData,
): Promise<IngredientRead> {
  const res = await fetch(`${BASE_URL}/proxy/ingredients/update`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (res.status === 401) throw new UnauthorizedError("Unauthorized");
  if (!res.ok) throw new Error(await res.text().catch(() => "Request failed"));

  const ingredient = (await res.json()) as IngredientRead;
  return ingredient;
}

export async function setIngredientImage(
  body: IngredientImageData,
): Promise<IngredientRead> {
  const res = await fetch(`${BASE_URL}/proxy/ingredients/image`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (res.status === 401) throw new UnauthorizedError("Unauthorized");
  if (!res.ok) throw new Error(await res.text().catch(() => "Request failed"));

  const ingredient = (await res.json()) as IngredientRead;
  return ingredient;
}

export async function fetchIngredientStocks(
  ingredient_id: string,
): Promise<IngredientStockRead[]> {
  const res = await fetch(
    `${BASE_URL}/proxy/ingredients/stocks?ingredient_id=${encodeURIComponent(ingredient_id)}`,
  );

  if (res.status === 401) {
    throw new UnauthorizedError();
  }

  if (!res.ok) {
    const msg = await safeReadError(res);
    throw new Error(msg || "Failed to fetch ingredient stocks");
  }

  const ingredientStocks = (await res.json()) as IngredientStockRead[];
  return ingredientStocks;
}

export async function createStock(
  body: IngredientStockBase,
): Promise<IngredientStockBase> {
  const res = await fetch(`${BASE_URL}/proxy/ingredients/stocks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.status === 401) {
    throw new UnauthorizedError();
  }

  if (!res.ok) {
    const msg = await safeReadError(res);
    throw new Error(msg || "Failed to create ingredient stock.");
  }

  const ingredient_stock = (await res.json()) as IngredientStockBase;
  return ingredient_stock;
}

export async function deleteIngredientStock(
  body: DeleteIngredientStockData,
): Promise<IngredientStockBase> {
  const res = await fetch(`${BASE_URL}/proxy/ingredients/stocks/delete`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (res.status === 401) throw new UnauthorizedError("Unauthorized");
  if (!res.ok) throw new Error(await res.text().catch(() => "Request failed"));

  const ingredient_stock = (await res.json()) as IngredientStockBase;
  return ingredient_stock;
}

export async function fetchSellers(name: string): Promise<SellerBase[]> {
  const res = await fetch(
    `${BASE_URL}/proxy/ingredients/sellers?name=${encodeURIComponent(name)}`,
  );

  if (res.status === 401) {
    throw new UnauthorizedError();
  }

  if (!res.ok) {
    const msg = await safeReadError(res);
    throw new Error(msg || "Failed to fetch sellers");
  }

  const sellers = (await res.json()) as SellerBase[];
  return sellers;
}

export async function fetchIngredientByName(
  name: string,
): Promise<IngredientBase[]> {
  const res = await fetch(
    `${BASE_URL}/proxy/ingredients/select?name=${encodeURIComponent(name)}`,
  );

  if (res.status === 401) {
    throw new UnauthorizedError();
  }

  if (!res.ok) {
    const msg = await safeReadError(res);
    throw new Error(msg || "Failed to fetch ingredients");
  }

  const ingredients = (await res.json()) as IngredientBase[];
  return ingredients;
}
