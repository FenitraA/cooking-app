import { normStr } from "../utils";
import { RecipeIngredientBase } from "./types";

export function isRecipeDirty(
  initial: {
    name: string;
    description: string;
    estimatedTime: string;
    parallelCooking: string;
    recipeIngredients: RecipeIngredientBase[];
  },
  current: typeof initial,
): boolean {
  // Compare recipe ingredients as "normalized rows"
  const recipeIngredientsA = initial.recipeIngredients
    .map(
      (recipeIngredient) =>
        `${normStr(recipeIngredient.refIngredientId)}|${recipeIngredient.quantity}`,
    )
    .sort();

  const recipeIngredientsB = current.recipeIngredients
    .map(
      (recipeIngredient) =>
        `${normStr(recipeIngredient.refIngredientId)}|${recipeIngredient.quantity}`,
    )
    .sort();

  if (recipeIngredientsA.length !== recipeIngredientsB.length) return true;
  for (let i = 0; i < recipeIngredientsA.length; i++) {
    if (recipeIngredientsA[i] !== recipeIngredientsB[i]) return true;
  }

  return (
    Object.keys(initial) as Array<
      Exclude<keyof typeof initial, "recipeIngredients">
    >
  ).some((key) => normStr(initial[key]) !== normStr(current[key]));
}
