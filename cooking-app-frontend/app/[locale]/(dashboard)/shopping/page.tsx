"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import ShoppingHistoryPage from "./ShoppingHistory";
import ShoppingItemListPage from "./ShoppingItemListPage";

export default function HouseholdPage() {
  const t = useTranslations("Shopping");
  const [activeTab, setActiveTab] = useState<"history" | "shopping">(
    "history",
  );

  return (
    <div className="mx-auto">
      {/* Tabs */}
      <div className="mb-4 flex border-b border-white/20">
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "history"
              ? "border-b-2 border-custom-sand-dune text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          {t("tabs.shopping_history")}
        </button>
        <button
          onClick={() => setActiveTab("shopping")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "shopping"
              ? "border-b-2 border-custom-sand-dune text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          {t("tabs.shopping_item_list")}
        </button>
      </div>

      {/* Content */}
      <div>
        {activeTab === "shopping" && <ShoppingItemListPage />}
        {activeTab === "history" && <ShoppingHistoryPage />}
      </div>
    </div>
  );
}
