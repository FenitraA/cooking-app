//Items category

import { IngredientBase } from "../ingredient/types";

export interface ItemCategoryBase {
  id: string;
  name: string;
}

//Items to buy
export interface ItemToBuySearchParams {
  name?: string;
  ingredient_id?: string;
  offset?: number;
  limit?: number;
}
export interface ItemToBuyBase {
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
export interface ItemToBuyRead {
  item_to_buy: ItemToBuyBase;
  item_category: ItemCategoryBase;
  ingredient_infos: IngredientBase;
}
export interface ItemToBuySearchResult {
  items: ItemToBuyRead[];
  total: number;
  offset: number;
  limit: number;
}
export interface ChangeStateToBoughtData {
  item_to_buy_id: string;
  shopping_item_id: string;
}

export interface DeleteItemToBuyData {
  item_to_buy_id: string;
}
export interface ItemToBuyUpdateData {
  id: string;
  estimated_unit_price: string;
  units_to_buy: string;
}
//Shopping item

export interface ShoppingItemSearchParams {
  name?: string;
  ingredient_id?: string;
  start_date?: string;
  end_date?: string;
  offset?: number;
  limit?: number;
}

export interface ShoppingItemBase {
  id: string;
  name: string;
  description: string;
  unit_price: string;
  units_bought: string;
  ref_shopping_id: string;
  ref_item_category_id: string;
}
export interface ShoppingItemRead {
  shopping_item: ShoppingItemBase;
  item_category: ItemCategoryBase;
  ingredient_infos: IngredientBase;
  shopping_date: string;
}
export interface ShoppingItemSearchResult {
  items: ShoppingItemRead[];
  total: number;
  offset: number;
  limit: number;
}
export interface DeleteShoppingItemData {
  shopping_item_id: string;
}

//Shopping

export interface ShoppingSearchParams {
  start_date?: string;
  end_date?: string;
  offset?: number;
  limit?: number;
}
export interface ShoppingBase {
  id: string;
  shopping_date: string;
  description: string;
  ref_household_id: string;
}
export interface ShoppingCreate extends ShoppingBase {
  shopping_items: ShoppingItemBase[];
}
export interface ShoppingCreateFromItemsToBuy extends ShoppingBase {
  item_to_buy_ids: string[];
}
export interface ShoppingRead {
  shopping: ShoppingBase;
  shopping_items: ShoppingItemRead[];
  total_cost: number;
}

export interface ShoppingSearchResult {
  items: ShoppingRead[];
  total: number;
  offset: number;
  limit: number;
}

export interface DeleteShoppingData {
  shopping_id: string;
}
