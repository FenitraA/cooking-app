"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import ItemToBuyListPage from "./ItemToBuyList";
import ItemToBuyCreatePage from "./CreateItemToBuy";

export default function ItemToBuyPage() {
  const t = useTranslations("Ingredient");
  const [refreshKey, setRefreshKey] = useState(0);
  const [createCollapsed, setCreateCollapsed] = useState(true);

  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  return (
    <div className="mx-auto">
      <div className="flex flex-col lg:flex-row gap-5">
        <div className="lg:w-2/3 w-full">
          <ItemToBuyListPage
            refreshKey={refreshKey}
            onRefresh={triggerRefresh}
          />
        </div>
        <div className="lg:w-1/3 w-full">
          <ItemToBuyCreatePage onCreated={triggerRefresh} />
        </div>
      </div>
    </div>
  );
}
