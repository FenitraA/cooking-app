import { ItemToBuyRead, ShoppingItemBase } from "./types";

export function itemToBuyToShoppingItem(itemsToBuy : ItemToBuyRead[]) : ShoppingItemBase[] {
    return itemsToBuy.map(item =>({
        id: "",
        name: item.itemToBuy.name,
        description: item.itemToBuy.description,
        unitPrice: item.itemToBuy.estimatedUnitPrice,
        unitsBought: item.itemToBuy.unitsToBuy,
        refShoppingId: "",
        refItemCategoryId: item.itemToBuy.refItemCategoryId,
    }));
}