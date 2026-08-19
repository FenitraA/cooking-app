import { normStr } from "../utils";
import { RecipeIngredientBase } from "./types";

export function isRecipeDirty(
  initial: {
    name: string;
    description: string;
    estimated_time: string;
    parallel_cooking: string;
    recipe_ingredients: RecipeIngredientBase[];
  },
  current: typeof initial,
): boolean {
  // Compare recipe ingredients as "normalized rows"
  const recipe_ingredients_a = initial.recipe_ingredients
    .map(
      (recipe_ingredient) =>
        `${normStr(recipe_ingredient.ref_ingredient_id)}|${recipe_ingredient.quantity}`,
    )
    .sort();

  const recipe_ingredients_b = current.recipe_ingredients
    .map(
      (recipe_ingredient) =>
        `${normStr(recipe_ingredient.ref_ingredient_id)}|${recipe_ingredient.quantity}`,
    )
    .sort();

  if (recipe_ingredients_a.length !== recipe_ingredients_b.length) return true;
  for (let i = 0; i < recipe_ingredients_a.length; i++) {
    if (recipe_ingredients_a[i] !== recipe_ingredients_b[i]) return true;
  }

  return (
    Object.keys(initial) as Array<
      Exclude<keyof typeof initial, "recipe_ingredients">
    >
  ).some((key) => normStr(initial[key]) !== normStr(current[key]));
}
