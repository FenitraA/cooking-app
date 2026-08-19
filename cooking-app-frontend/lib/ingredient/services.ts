import { normStr } from "../utils";

export function isIngredientDirty(
  initial: {
    name: string;
    ingredient_unit_id: string;
    ingredient_type_id: string;
    estimated_price: string;
  },
  current: typeof initial,
): boolean {
  return (Object.keys(initial) as Array<keyof typeof initial>).some(
    (key) => normStr(initial[key]) !== normStr(current[key]),
  );
}