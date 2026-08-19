"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Beef,
  CalendarDays,
  CookingPot,
  Expand,
  Minimize,
  Notebook,
  NotebookPen,
  PackagePlus,
  ShoppingBag,
  ShoppingCart,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function Sidebar({
  toggleMobileMenu,
}: {
  toggleMobileMenu: () => void;
}) {
  const t = useTranslations("Sidebar");

  const nav = [
    { href: "/ingredient", label: t("ingredients"), icon: Beef },
    { href: "/recipe/create", label: t("recipes_create"), icon: NotebookPen },
    { href: "/recipe/list", label: t("recipes_list"), icon: Notebook },
    { href: "/recipe/meal", label: t("meals"), icon: CookingPot },
    { href: "/planning", label: t("planning"), icon: CalendarDays },
    { href: "/shopping", label: t("shopping"), icon: ShoppingCart },
    { href: "/shopping/to-buy", label: t("item_to_buy"), icon:  PackagePlus},
  ];

  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);

  return (
    <aside
      className={[
        "overflow-x-visible",
        "h-screen border-r border-white/10 bg-custom-dark-blue text-gray-100",
        "transition-all duration-200",
        collapsed ? "w-16" : "min-w-74",
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 p-3">
        <div className="flex flex-1 justify-left gap-2 overflow-hidden">
          {!collapsed && (
            <span className="text-sm ml-4 font-semibold text-gray-100">
              {t("menu")}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="rounded-md p-2 hover:bg-white/10 cursor-pointer text-gray-100 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
        >
          {collapsed && <Expand size={18} />}
          {!collapsed && <Minimize size={18} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="p-3 space-y-2">
        {nav.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.endsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "group relative flex items-center rounded-lg text-sm transition-all",
                "hover:bg-custom-blue/5",
                isActive ? "bg-custom-blue/5" : "bg-white/5",
                collapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-2",
              ].join(" ")}
              onClick={toggleMobileMenu}
            >
              {/* Accent bar */}
              <span
                className={[
                  "absolute left-0 top-1/2 h-full w-1.5 -translate-y-1/2 rounded bg-green-700",
                  isActive
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100",
                ].join(" ")}
              />

              {/* Icon */}
              <Icon
                size={18}
                className={isActive ? "text-gray-200" : "text-gray-400"}
              />

              {/* Label */}
              {!collapsed && (
                <span className="whitespace-nowrap ">{item.label}</span>
              )}

              {/* Tooltip when collapsed */}
              {collapsed && (
                <span
                  className={[
                    "pointer-events-none absolute left-full ml-6",
                    "rounded-md bg-gray-900 px-2 py-1 text-xs text-white",
                    "opacity-0 translate-x-1 transition-all",
                    "group-hover:opacity-100 group-hover:translate-x-0",
                    "whitespace-nowrap",
                  ].join(" ")}
                >
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
