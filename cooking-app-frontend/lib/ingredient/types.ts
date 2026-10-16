
import { CamelCasedPropertiesDeep } from "../case-types";

// Ingredients

export interface IngredientSearchParamsApi {
  name?: string;
  type_id?: string;
  min_stock?: string;
  sort_by?: string;
  sort_direction?: string;
  offset?: number;
  limit?: number;
}

export type IngredientSearchParams =
  CamelCasedPropertiesDeep<IngredientSearchParamsApi>;

export interface IngredientBaseApiResponse {
  id: string;
  name: string;
  unit?: string;
  ref_ingredient_unit_id: string;
  ref_ingredient_type_id: string;
  estimated_price: string;
  image_url: string | null;
  storage_key: string | null;
}

export type IngredientBase =
  CamelCasedPropertiesDeep<IngredientBaseApiResponse>;

export interface IngredientImageDataApiResponse {
  id: string;
  image_url: string;
  storage_key: string;
}

export type IngredientImageData =
  CamelCasedPropertiesDeep<IngredientImageDataApiResponse>;

export interface IngredientReadApiResponse {
  ingredient: IngredientBaseApiResponse;
  ingredient_unit: IngredientUnitBaseApiResponse;
  ingredient_type: IngredientTypeBaseApiResponse;
  quantity_left: number;
  group_name: string;
}

export type IngredientRead =
  CamelCasedPropertiesDeep<IngredientReadApiResponse>;

export interface IngredientSearchResultApiResponse {
  items: IngredientReadApiResponse[];
  total: number;
  offset: number;
  limit: number;
}

export type IngredientSearchResult =
  CamelCasedPropertiesDeep<IngredientSearchResultApiResponse>;

export interface IngredientUpdateDataApiRequest {
  id: string;
  name: string;
  ref_ingredient_unit_id: string;
  ref_ingredient_type_id: string;
  estimated_price: string;
}

export type IngredientUpdateData =
  CamelCasedPropertiesDeep<IngredientUpdateDataApiRequest>;

// Ingredient stock

export interface IngredientStockBaseApiResponse {
  id: string;
  unit_cost: string;
  quantity: string;
  ref_seller_id: string;
  ref_ingredient_id: string;
}

export type IngredientStockBase =
  CamelCasedPropertiesDeep<IngredientStockBaseApiResponse>;

export interface IngredientStockReadApiResponse {
  ingredient_stock: IngredientStockBaseApiResponse;
  ingredient_name: string;
  ingredient_unit: string;
  seller_name: string;
  quantity_left: number;
}

export type IngredientStockRead =
  CamelCasedPropertiesDeep<IngredientStockReadApiResponse>;

export interface DeleteIngredientStockApiRequest {
  ingredient_stock_id: string;
}

export type DeleteIngredientStockData =
  CamelCasedPropertiesDeep<DeleteIngredientStockApiRequest>;

// Ingredient type

export interface IngredientTypeBaseApiResponse {
  id: string;
  name: string;
}

export type IngredientTypeBase =
  CamelCasedPropertiesDeep<IngredientTypeBaseApiResponse>;

// Ingredient unit

export interface IngredientUnitBaseApiResponse {
  id: string;
  name: string;
  symbol: string;
  multiplier_to_base: string;
  ref_unit_group_id: string;
}

export type IngredientUnitBase =
  CamelCasedPropertiesDeep<IngredientUnitBaseApiResponse>;

// Seller

export interface SellerBaseApiResponse {
  id: string;
  name: string;
}

export type SellerBase =
  CamelCasedPropertiesDeep<SellerBaseApiResponse>;
