
from decimal import Decimal

from app.schemas.shopping_item import ShoppingItemRead


def get_total_estimated_price_from_items(
    shopping_items: list[ShoppingItemRead],
) -> Decimal:
    total = 0
    for item in shopping_items:
        total += (item.shopping_item.unit_price*item.shopping_item.units_bought)
    return total