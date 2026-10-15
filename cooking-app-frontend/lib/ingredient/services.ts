import { normStr } from "../utils";

export function isIngredientDirty(
  initial: {
    name: string;
    ingredientUnitId: string;
    ingredientTypeId: string;
    estimatedPrice: string;
  },
  current: typeof initial,
): boolean {
  return (Object.keys(initial) as Array<keyof typeof initial>).some(
    (key) => normStr(initial[key]) !== normStr(current[key]),
  );
}