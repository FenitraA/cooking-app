from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth_api,
    cloudinary_api,
    household_api,
    ingredient_api,
    planning_api,
    recipe_api,
    user_api,
    item_to_buy_api,
    shopping_item_api,
    shopping_api,
    item_category_api
)

api_router = APIRouter()
api_router.include_router(auth_api.router, prefix="/auth")
api_router.include_router(user_api.router, prefix="/users")
api_router.include_router(household_api.router, prefix="/households")
api_router.include_router(ingredient_api.router, prefix="/ingredients")
api_router.include_router(planning_api.router, prefix="/planning")
api_router.include_router(recipe_api.router, prefix="/recipes")
api_router.include_router(item_to_buy_api.router, prefix="/items-to-buy")
api_router.include_router(shopping_item_api.router, prefix="/shopping-items")
api_router.include_router(shopping_api.router, prefix="/shoppings")
api_router.include_router(item_category_api.router, prefix="/item-categories")
api_router.include_router(cloudinary_api.router, prefix="/cloudinary")