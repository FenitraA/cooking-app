from collections import defaultdict
from datetime import date, timedelta
from decimal import Decimal
from babel.dates import format_date

from app.schemas.planning_recipe import PlanningRecipeRead, PlanningRepartition
from app.schemas.recipe import RecipeIngredientRead
from copy import deepcopy

def redistribute_to_repartition(
    start_of_week: date,
    end_of_week: date,
    recipes: list[PlanningRecipeRead],
) -> list[PlanningRepartition]:
    grouped_data = defaultdict(list)

    for recipe_read in recipes:
        grouped_data[recipe_read.planning_recipe.planning_date].append(recipe_read)

    repartition_list: list[PlanningRepartition] = []

    current_date = start_of_week

    while current_date <= end_of_week:
        repartition_list.append(
            PlanningRepartition(
                planning_group_date=current_date,
                day_name=format_date(current_date, format="EEEE", locale="fr_FR"),
                planning_recipes=grouped_data.get(current_date, []),
                estimated_cost_price=get_total_estimated_price(
                    grouped_data.get(current_date, [])
                ),
            )
        )

        current_date += timedelta(days=1)

    return repartition_list


def get_total_estimated_price(planning_recipes: list[PlanningRecipeRead]) -> Decimal:
    total = 0
    for planning_recipe in planning_recipes:
        total += planning_recipe.estimated_cost_price
    return total

def get_total_estimated_price_from_repartitions(
    planning_repartitions: list[PlanningRepartition],
) -> Decimal:
    total = 0
    for repartition in planning_repartitions:
        total += repartition.estimated_cost_price
    return total

def get_total_ingredients_to_buy(
    planning_repartitions: list[PlanningRepartition],
) -> list[RecipeIngredientRead]:
    ingredients: dict[str, RecipeIngredientRead] = {}

    for repartition in planning_repartitions:
        for planning_recipe in repartition.planning_recipes:
            servings = planning_recipe.planning_recipe.nb_serving

            for ingredient in planning_recipe.recipe_ingredients:
                ingredient_id = (
                    ingredient.recipe_ingredient_base.ref_ingredient_id
                )

                if ingredient_id is None:
                    continue

                total_quantity = (
                    ingredient.recipe_ingredient_base.quantity
                    * servings
                )
                total_estimated_price = (
                    ingredient.estimated_cost_per_unit * servings
                )
                
                if ingredient_id not in ingredients:
                    aggregated = deepcopy(ingredient)
                    aggregated.recipe_ingredient_base.quantity = (
                        total_quantity
                    )
                    aggregated.estimated_cost_per_unit = total_estimated_price
                    ingredients[ingredient_id] = aggregated
                else:
                    ingredients[
                        ingredient_id
                    ].recipe_ingredient_base.quantity += (
                        total_quantity
                    )

                    ingredients[
                        ingredient_id
                    ].estimated_cost_per_unit += (
                        total_estimated_price
                    )

    return list(ingredients.values()) 

