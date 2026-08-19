import { UnauthorizedError } from "../errors";
import { safeReadError } from "../utils";
import { BASE_URL } from "../variables";
import {
  DeleteItemToBuyData,
  DeleteShoppingData,
  DeleteShoppingItemData,
  ItemCategoryBase,
  ItemToBuyBase,
  ItemToBuyRead,
  ItemToBuySearchParams,
  ItemToBuySearchResult,
  ItemToBuyUpdateData,
  ShoppingBase,
  ShoppingCreate,
  ShoppingCreateFromItemsToBuy,
  ShoppingItemBase,
  ShoppingItemSearchParams,
  ShoppingItemSearchResult,
  ShoppingSearchParams,
  ShoppingSearchResult,
} from "./types";

//Item categories
export async function fetchItemCategories(
  name: string,
): Promise<ItemCategoryBase[]> {
  const res = await fetch(
    `${BASE_URL}/proxy/item-categories?name=${encodeURIComponent(name)}`,
  );

  if (res.status === 401) {
    throw new UnauthorizedError();
  }

  if (!res.ok) {
    const msg = await safeReadError(res);
    throw new Error(msg || "Failed to fetch item categories");
  }

  const itemCategories = (await res.json()) as ItemCategoryBase[];
  return itemCategories;
}
export async function fetchIngredientItemCategory(): Promise<ItemCategoryBase> {
  const res = await fetch(`${BASE_URL}/proxy/item-categories/ingredient`);

  if (res.status === 401) {
    throw new UnauthorizedError();
  }

  if (!res.ok) {
    const msg = await safeReadError(res);
    throw new Error(msg || "Failed to fetch ingredient category");
  }

  const data = (await res.json()) as ItemCategoryBase;
  return data;
}

//Items to buy
export async function createItemToBuy(
  body: ItemToBuyBase,
): Promise<ItemToBuyBase> {
  const res = await fetch(`${BASE_URL}/proxy/items-to-buy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.status === 401) {
    throw new UnauthorizedError();
  }

  if (!res.ok) {
    const msg = await safeReadError(res);
    throw new Error(msg || "Failed to create item to buy.");
  }

  const item_to_buy = (await res.json()) as ItemToBuyBase;
  return item_to_buy;
}

export async function fetchItemToBuySearch(
  searchParams: ItemToBuySearchParams,
): Promise<ItemToBuySearchResult> {
  const params = new URLSearchParams();

  if (searchParams.name) {
    params.set("name", searchParams.name);
  }
  if (searchParams.ingredient_id) {
    params.set("ingredient_id", searchParams.ingredient_id);
  }
  if (searchParams.offset !== undefined) {
    params.set("offset", String(searchParams.offset));
  }
  if (searchParams.limit !== undefined) {
    params.set("limit", String(searchParams.limit));
  }

  const res = await fetch(
    `${BASE_URL}/proxy/items-to-buy?${params.toString()}`,
  );

  if (res.status === 401) {
    throw new UnauthorizedError();
  }

  if (!res.ok) {
    const msg = await safeReadError(res);
    throw new Error(msg || "Failed to fetch items to buy.");
  }

  const data = (await res.json()) as ItemToBuySearchResult;
  return data;
}

export async function deleteItemToBuy(
  body: DeleteItemToBuyData,
): Promise<ItemToBuyBase> {
  const res = await fetch(`${BASE_URL}/proxy/items-to-buy/delete`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (res.status === 401) throw new UnauthorizedError("Unauthorized");
  if (!res.ok) throw new Error(await res.text().catch(() => "Request failed"));

  const data = (await res.json()) as ItemToBuyBase;
  return data;
}

export async function updateItemToBuy(
  body: ItemToBuyUpdateData,
): Promise<ItemToBuyRead> {
  const res = await fetch(`${BASE_URL}/proxy/items-to-buy/update`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (res.status === 401) throw new UnauthorizedError("Unauthorized");
  if (!res.ok) throw new Error(await res.text().catch(() => "Request failed"));

  const data = (await res.json()) as ItemToBuyRead;
  return data;
}
//Shopping items

export async function fetchShoppingItemSearch(
  searchParams: ShoppingItemSearchParams,
): Promise<ShoppingItemSearchResult> {
  const params = new URLSearchParams();

  if (searchParams.name) {
    params.set("name", searchParams.name);
  }
  if (searchParams.ingredient_id) {
    params.set("ingredient_id", searchParams.ingredient_id);
  }
  if (searchParams.offset !== undefined) {
    params.set("offset", String(searchParams.offset));
  }
  if (searchParams.limit !== undefined) {
    params.set("limit", String(searchParams.limit));
  }

  const res = await fetch(
    `${BASE_URL}/proxy/shopping-items?${params.toString()}`,
  );

  if (res.status === 401) {
    throw new UnauthorizedError();
  }

  if (!res.ok) {
    const msg = await safeReadError(res);
    throw new Error(msg || "Failed to fetch items to buy.");
  }

  const data = (await res.json()) as ShoppingItemSearchResult;
  return data;
}

export async function deleteShoppingItem(
  body: DeleteShoppingItemData,
): Promise<ShoppingItemBase> {
  const res = await fetch(`${BASE_URL}/proxy/items-to-buy/delete`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (res.status === 401) throw new UnauthorizedError("Unauthorized");
  if (!res.ok) throw new Error(await res.text().catch(() => "Request failed"));

  const data = (await res.json()) as ShoppingItemBase;
  return data;
}

//Shopping
export async function createShopping(
  body: ShoppingCreate,
): Promise<ShoppingBase> {
  const res = await fetch(`${BASE_URL}/proxy/shoppings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.status === 401) {
    throw new UnauthorizedError();
  }

  if (!res.ok) {
    const msg = await safeReadError(res);
    throw new Error(msg || "Failed to create shopping.");
  }

  const data = (await res.json()) as ShoppingBase;
  return data;
}
export async function createShoppingFromItemsToBuy(
  body: ShoppingCreateFromItemsToBuy,
): Promise<ShoppingBase> {
  const res = await fetch(`${BASE_URL}/proxy/shoppings/from-items-to-buy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.status === 401) {
    throw new UnauthorizedError();
  }

  if (!res.ok) {
    const msg = await safeReadError(res);
    throw new Error(msg || "Failed to create shopping.");
  }

  const data = (await res.json()) as ShoppingBase;
  return data;
}

export async function fetchShoppingSearch(
  searchParams: ShoppingSearchParams,
): Promise<ShoppingSearchResult> {
  const params = new URLSearchParams();

  if (searchParams.start_date) {
    params.set("start_date", searchParams.start_date);
  }
  if (searchParams.end_date) {
    params.set("end_date", searchParams.end_date);
  }
  if (searchParams.offset !== undefined) {
    params.set("offset", String(searchParams.offset));
  }
  if (searchParams.limit !== undefined) {
    params.set("limit", String(searchParams.limit));
  }

  const res = await fetch(`${BASE_URL}/proxy/shoppings?${params.toString()}`);

  if (res.status === 401) {
    throw new UnauthorizedError();
  }

  if (!res.ok) {
    const msg = await safeReadError(res);
    throw new Error(msg || "Failed to fetch shoppings.");
  }

  const data = (await res.json()) as ShoppingSearchResult;
  return data;
}

export async function deleteShopping(
  body: DeleteShoppingData,
): Promise<ShoppingBase> {
  const res = await fetch(`${BASE_URL}/proxy/items-to-buy/delete`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (res.status === 401) throw new UnauthorizedError("Unauthorized");
  if (!res.ok) throw new Error(await res.text().catch(() => "Request failed"));

  const data = (await res.json()) as ShoppingBase;
  return data;
}
