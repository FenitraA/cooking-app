import { format } from "date-fns";
import { normStr } from "../utils";

export function isPlanningRecipeDirty(
  initial: {
    ref_recipe_id: string;
    planning_date: string;
    nb_serving: string;
    description: string;
  },
  current: typeof initial,
): boolean {
  return (Object.keys(initial) as Array<keyof typeof initial>).some(
    (key) => normStr(initial[key]) !== normStr(current[key]),
  );
}

export function toPythonCompatibleDate(dates : Date[]){
  return dates.map(date => 
    format(date, 'yyyy-MM-dd')
  );
}