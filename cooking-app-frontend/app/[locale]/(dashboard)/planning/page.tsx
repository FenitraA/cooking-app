"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import PlanningList from "./PlanningList";
import CreatePlanning from "./CreatePlanning";

export default function HouseholdPage() {
  const translations = useTranslations("Planning");
  const [refreshKey, setRefreshKey] = useState(0);
  const [createCollapsed, setCreateCollapsed] = useState(true);

  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  return (
    <div className="py-6 mx-auto">
      <div className="flex flex-col lg:flex-row gap-5 overflow-hidden">
        {/* List */}
        <div className="transition-all w-full duration-300 lg:w-[calc(100%-4rem)] flex-1">
          <PlanningList
            refreshKey={refreshKey}
            onRefresh={triggerRefresh}
          />
        </div>

        {/* Create panel */}
        <div
          className={`relative transition-all duration-300 ${
            createCollapsed ? "basis-16 min-w-16" : "basis-1/4 min-w-80"
          }`}
        >
          <button
            type="button"
            onClick={() => setCreateCollapsed((v) => !v)}
            className="
              absolute
              top-2
              right-2
              lg:-left-3
              lg:right-auto
              z-10
              rounded-full
              bg-custom-dark-blue
              p-1.5
              text-white
              shadow-md
              cursor-pointer
              border
              border-custom-sand-dune
            "
          >
            {createCollapsed ? (
              <ChevronLeft size={18} />
            ) : (
              <ChevronRight size={18} />
            )}
          </button>

          {createCollapsed ? (
            <div className="h-full rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
              <span className="text-xl font-medium text-custom-sand-dune lg:[writing-mode:vertical-rl]">
                {translations("create_title")}
              </span>
            </div>
          ) : (
            <CreatePlanning onCreated={triggerRefresh} />
          )}
        </div>
      </div>
    </div>
  );
}
