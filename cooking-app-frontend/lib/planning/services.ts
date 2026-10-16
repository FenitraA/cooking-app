import { format } from "date-fns";
import { normStr } from "../utils";

export function isPlanningRecipeDirty(
  initial: {
    refRecipeId: string;
    planningDate: string;
    nbServing: string;
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