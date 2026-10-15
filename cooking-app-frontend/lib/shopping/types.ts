import { CamelCasedPropertiesDeep } from "../case-types";
import type { IngredientBaseApiResponse } from "../ingredient/types";

// Items category

export interface ItemCategoryApiResponse {
  id: string;
  name: string;
}

export type ItemCategoryBase =
  CamelCasedPropertiesDeep<ItemCategoryApiResponse>;

// Items to buy

export interface ItemToBuySearchParamsApi {
  name?: string;
  ingredient_id?: string;
  offset?: number;
  limit?: number;
}

export type ItemToBuySearchParams =
  CamelCasedPropertiesDeep<ItemToBuySearchParamsApi>;

export interface ItemToBuyBaseApiResponse {
  id: string;
  name: string;
  description: string;
  estimated_unit_price: string;
  units_to_buy: string;
  ref_ingredient_id: string | null;
  ref_shopping_item_id: string | null;
  ref_item_category_id: string;
  ref_household_id: string;
}

export type ItemToBuyBase = CamelCasedPropertiesDeep<ItemToBuyBaseApiResponse>;

export interface ItemToBuyReadApiResponse {
  item_to_buy: ItemToBuyBaseApiResponse;
  item_category: ItemCategoryApiResponse;
  ingredient_infos: IngredientBaseApiResponse;
  ingredient_unit: string;
}

export type ItemToBuyRead = CamelCasedPropertiesDeep<ItemToBuyReadApiResponse>;

export interface ItemToBuySearchResultApiResponse {
  items: ItemToBuyReadApiResponse[];
  total: number;
  offset: number;
  limit: number;
}

export type ItemToBuySearchResult =
  CamelCasedPropertiesDeep<ItemToBuySearchResultApiResponse>;

export interface ChangeStateToBoughtApiRequest {
  item_to_buy_id: string;
  shopping_item_id: string;
}

export type ChangeStateToBoughtData =
  CamelCasedPropertiesDeep<ChangeStateToBoughtApiRequest>;

export interface DeleteItemToBuyApiRequest {
  item_to_buy_id: string;
}

export type DeleteItemToBuyData =
  CamelCasedPropertiesDeep<DeleteItemToBuyApiRequest>;

export interface ItemToBuyUpdateApiRequest {
  id: string;
  estimated_unit_price: string;
  units_to_buy: string;
}

export type ItemToBuyUpdateData =
  CamelCasedPropertiesDeep<ItemToBuyUpdateApiRequest>;

// Shopping item

export interface ShoppingItemSearchParamsApi {
  name?: string;
  ingredient_id?: string;
  start_date?: string;
  end_date?: string;
  offset?: number;
  limit?: number;
}

export type ShoppingItemSearchParams =
  CamelCasedPropertiesDeep<ShoppingItemSearchParamsApi>;

export interface ShoppingItemBaseApiResponse {
  id: string;
  name: string;
  description: string;
  unit_price: string;
  units_bought: string;
  ref_shopping_id: string;
  ref_item_category_id: string;
}

export type ShoppingItemBase =
  CamelCasedPropertiesDeep<ShoppingItemBaseApiResponse>;

export interface ShoppingItemReadApiResponse {
  shopping_item: ShoppingItemBaseApiResponse;
  item_category: ItemCategoryApiResponse;
  ingredient_infos: IngredientBaseApiResponse;
  ingredient_unit: string;
  shopping_date: string;
}

export type ShoppingItemRead =
  CamelCasedPropertiesDeep<ShoppingItemReadApiResponse>;

export interface ShoppingItemSearchResultApiResponse {
  items: ShoppingItemReadApiResponse[];
  total: number;
  offset: number;
  limit: number;
}

export type ShoppingItemSearchResult =
  CamelCasedPropertiesDeep<ShoppingItemSearchResultApiResponse>;

export interface DeleteShoppingItemApiRequest {
  shopping_item_id: string;
}

export type DeleteShoppingItemData =
  CamelCasedPropertiesDeep<DeleteShoppingItemApiRequest>;

// Shopping

export interface ShoppingSearchParamsApi {
  start_date?: string;
  end_date?: string;
  offset?: number;
  limit?: number;
}

export type ShoppingSearchParams =
  CamelCasedPropertiesDeep<ShoppingSearchParamsApi>;

export interface ShoppingBaseApiResponse {
  id: string;
  shopping_date: string;
  description: string;
  ref_household_id: string;
}

export type ShoppingBase = CamelCasedPropertiesDeep<ShoppingBaseApiResponse>;

export interface ShoppingCreateApiRequest extends ShoppingBaseApiResponse {
  shopping_items: ShoppingItemBaseApiResponse[];
}

export type ShoppingCreate = CamelCasedPropertiesDeep<ShoppingCreateApiRequest>;

export interface ShoppingCreateFromItemsToBuyApiRequest extends ShoppingBaseApiResponse {
  item_to_buy_ids: string[];
}

export type ShoppingCreateFromItemsToBuy =
  CamelCasedPropertiesDeep<ShoppingCreateFromItemsToBuyApiRequest>;

export interface ShoppingReadApiResponse {
  shopping: ShoppingBaseApiResponse;
  shopping_items: ShoppingItemReadApiResponse[];
  total_cost: number;
}

export type ShoppingRead = CamelCasedPropertiesDeep<ShoppingReadApiResponse>;

export interface ShoppingSearchResultApiResponse {
  items: ShoppingReadApiResponse[];
  total: number;
  offset: number;
  limit: number;
}

export type ShoppingSearchResult =
  CamelCasedPropertiesDeep<ShoppingSearchResultApiResponse>;

export interface DeleteShoppingApiRequest {
  shopping_id: string;
}

export type DeleteShoppingData =
  CamelCasedPropertiesDeep<DeleteShoppingApiRequest>;
