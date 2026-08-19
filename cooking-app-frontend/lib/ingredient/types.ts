// Ingredients
export interface IngredientSearchParams {
  name?: string;
  type_id?: string;
  min_stock?: string;
  sort_by? : string;
  sort_direction? : string;
  offset?: number;
  limit?: number;
}
export interface IngredientBase {
  id: string;
  name: string;
  unit?: string;
  ref_ingredient_unit_id: string;
  ref_ingredient_type_id: string;
  estimated_price: string;
  image_url: string | null;
  storage_key: string | null;
}
export interface IngredientImageData {
  id: string;
  image_url: string;
  storage_key: string;
}
export interface IngredientRead {
  ingredient: IngredientBase;
  ingredient_unit: IngredientUnitBase;
  ingredient_type: IngredientTypeBase;
  quantity_left: number;
  group_name: string;
}
export interface IngredientSearchResult {
  items: IngredientRead[];
  total: number;
  offset: number;
  limit: number;
}
export interface IngredientUpdateData {
  id: string;
  name: string;
  ref_ingredient_unit_id: string;
  ref_ingredient_type_id: string;
  estimated_price: string;
}

//Ingredient stock
export interface IngredientStockBase {
  id: string;
  unit_cost: string;
  quantity: string;
  ref_seller_id: string;
  ref_ingredient_id: string;
}
export interface IngredientStockRead {
  ingredient_stock: IngredientStockBase;
  ingredient_name: string;
  ingredient_unit: string;
  seller_name: string;
  quantity_left: number;
}

export interface DeleteIngredientStockData {
  ingredient_stock_id: string;
}

//Ingredient type
export interface IngredientTypeBase {
  id: string;
  name: string;
}

//Ingredient unit
export interface IngredientUnitBase {
  id: string;
  name: string;
  symbol: string;
  multiplier_to_base: string;
  ref_unit_group_id : string;
}
//Seller
export interface SellerBase {
  id: string;
  name: string;
}
