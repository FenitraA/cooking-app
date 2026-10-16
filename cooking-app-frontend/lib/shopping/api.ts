
import { apiFetch } from "../api-client";
import { BASE_URL } from "../variables";
import type {
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

// Item categories
export function fetchItemCategories(
  name: string,
): Promise<ItemCategoryBase[]> {
  const params = new URLSearchParams({ name });

  return apiFetch<ItemCategoryBase[]>(
    `${BASE_URL}/proxy/item-categories?${params.toString()}`,
  );
}

export function fetchIngredientItemCategory(): Promise<ItemCategoryBase> {
  return apiFetch<ItemCategoryBase>(
    `${BASE_URL}/proxy/item-categories/ingredient`,
  );
}

// Items to buy
export function createItemToBuy(
  body: ItemToBuyBase,
): Promise<ItemToBuyBase> {
  return apiFetch<ItemToBuyBase>(`${BASE_URL}/proxy/items-to-buy`, {
    method: "POST",
    json: body,
  });
}

export function fetchItemToBuySearch(
  searchParams: ItemToBuySearchParams,
): Promise<ItemToBuySearchResult> {
  const params = new URLSearchParams();

  if (searchParams.name) {
    params.set("name", searchParams.name);
  }
  if (searchParams.ingredientId) {
    params.set("ingredient_id", searchParams.ingredientId);
  }
  if (searchParams.offset !== undefined) {
    params.set("offset", String(searchParams.offset));
  }
  if (searchParams.limit !== undefined) {
    params.set("limit", String(searchParams.limit));
  }

  return apiFetch<ItemToBuySearchResult>(
    `${BASE_URL}/proxy/items-to-buy?${params.toString()}`,
  );
}

export function deleteItemToBuy(
  body: DeleteItemToBuyData,
): Promise<ItemToBuyBase> {
  return apiFetch<ItemToBuyBase>(
    `${BASE_URL}/proxy/items-to-buy/delete`,
    {
      method: "PATCH",
      json: body,
    },
  );
}

export function updateItemToBuy(
  body: ItemToBuyUpdateData,
): Promise<ItemToBuyRead> {
  return apiFetch<ItemToBuyRead>(
    `${BASE_URL}/proxy/items-to-buy/update`,
    {
      method: "PATCH",
      json: body,
    },
  );
}

// Shopping items
export function fetchShoppingItemSearch(
  searchParams: ShoppingItemSearchParams,
): Promise<ShoppingItemSearchResult> {
  const params = new URLSearchParams();

  if (searchParams.name) {
    params.set("name", searchParams.name);
  }
  if (searchParams.ingredientId) {
    params.set("ingredient_id", searchParams.ingredientId);
  }
  if (searchParams.offset !== undefined) {
    params.set("offset", String(searchParams.offset));
  }
  if (searchParams.limit !== undefined) {
    params.set("limit", String(searchParams.limit));
  }

  return apiFetch<ShoppingItemSearchResult>(
    `${BASE_URL}/proxy/shopping-items?${params.toString()}`,
  );
}

export function deleteShoppingItem(
  body: DeleteShoppingItemData,
): Promise<ShoppingItemBase> {
  return apiFetch<ShoppingItemBase>(
    `${BASE_URL}/proxy/shopping-items/delete`,
    {
      method: "PATCH",
      json: body,
    },
  );
}

// Shopping
export function createShopping(
  body: ShoppingCreate,
): Promise<ShoppingBase> {
  return apiFetch<ShoppingBase>(`${BASE_URL}/proxy/shoppings`, {
    method: "POST",
    json: body,
  });
}

export function createShoppingFromItemsToBuy(
  body: ShoppingCreateFromItemsToBuy,
): Promise<ShoppingBase> {
  return apiFetch<ShoppingBase>(
    `${BASE_URL}/proxy/shoppings/from-items-to-buy`,
    {
      method: "POST",
      json: body,
    },
  );
}

export function fetchShoppingSearch(
  searchParams: ShoppingSearchParams,
): Promise<ShoppingSearchResult> {
  const params = new URLSearchParams();

  if (searchParams.startDate) {
    params.set("start_date", searchParams.startDate);
  }
  if (searchParams.endDate) {
    params.set("end_date", searchParams.endDate);
  }
  if (searchParams.offset !== undefined) {
    params.set("offset", String(searchParams.offset));
  }
  if (searchParams.limit !== undefined) {
    params.set("limit", String(searchParams.limit));
  }

  return apiFetch<ShoppingSearchResult>(
    `${BASE_URL}/proxy/shoppings?${params.toString()}`,
  );
}

export function deleteShopping(
  body: DeleteShoppingData,
): Promise<ShoppingBase> {
  return apiFetch<ShoppingBase>(
    `${BASE_URL}/proxy/shoppings/delete`,
    {
      method: "PATCH",
      json: body,
    },
  );
}
