import { ItemToBuyRead, ShoppingItemBase } from "./types";

export function item_to_buy_to_shopping_item(items_to_buy : ItemToBuyRead[]) : ShoppingItemBase[] {
    return items_to_buy.map(item =>({
        id: "",
        name: item.item_to_buy.name,
        description: item.item_to_buy.description,
        unit_price: item.item_to_buy.estimated_unit_price,
        units_bought: item.item_to_buy.units_to_buy,
        ref_shopping_id: "",
        ref_item_category_id: item.item_to_buy.ref_item_category_id,
    }));
}