"use client";

import { useState } from "react";
import MealCreatePage from "./MealCreate";
import MealListPage from "./MealList";

export default function MealPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  return (
    <div className="flex flex-col lg:flex-row flex-wrap gap-6">
      <div className="flex flex-col rounded-xl border w-full lg:w-1/2 lg:min-w-140 min-h-full py-4 px-6 space-y-6 mt-6 bg-white/10 border-white/20">
        <MealCreatePage onCreated={triggerRefresh} />
      </div>
      <div className="flex flex-col rounded-xl border w-full flex-1 lg:min-w-140 min-h-full py-4 px-6 space-y-6 mt-6 bg-white/10 border-white/20">
        <MealListPage refreshKey={refreshKey} refreshTrigger={triggerRefresh}/>
      </div>
    </div>
  );
}