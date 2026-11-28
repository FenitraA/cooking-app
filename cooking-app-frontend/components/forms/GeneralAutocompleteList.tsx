"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { SquareX, RotateCw, Plus, Search } from "lucide-react";

import { UnauthorizedError } from "@/lib/errors";

type Props<T> = {
  translationsKey: string;

  showShadow?: boolean;
  showLabel?: boolean;

  label?: string;

  values: T[];
  onChange: (items: T[]) => void;

  getKey: (item: T) => string | number;
  getName: (item: T) => string;

  fetchOptions: (query: string, signal?: AbortSignal) => Promise<T[]>;

  className?: string;
  error?: string;
};

export default function GeneralAutocompleteList<T>({
  translationsKey = "",
  showShadow = false,
  showLabel = true,
  label,

  values,
  onChange,

  getKey,
  getName,

  fetchOptions,

  className,
  error,
}: Props<T>) {
  const router = useRouter();
  const t = useTranslations(translationsKey);

  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<T[]>([]);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const boxRef = useRef<HTMLDivElement | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!boxRef.current) return;

      if (!boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onClickOutside);

    return () => {
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, []);

  const loadOptions = useCallback(
    async (q: string) => {
      abortRef.current?.abort();

      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);

      try {
        const items = await fetchOptions(q, controller.signal);

        if (controller.signal.aborted || !mountedRef.current) {
          return;
        }

        setOptions(items);
      } catch (e: unknown) {
        if (!mountedRef.current) return;

        if (e instanceof DOMException && e.name === "AbortError") {
          return;
        }

        if (e instanceof UnauthorizedError) {
          router.replace("/login");
          return;
        }

        setOptions([]);
      } finally {
        if (mountedRef.current && !controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [fetchOptions, router],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadOptions(query.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [query, loadOptions]);

  function addItem() {
    if (!selectedItem) return;

    const exists = values.some((item) => getKey(item) === getKey(selectedItem));

    if (exists) {
      setSelectedItem(null);
      setQuery("");
      return;
    }

    onChange([...values, selectedItem]);

    setSelectedItem(null);
    setQuery("");
    setOptions([]);
    setOpen(false);
  }

  function removeItem(itemToRemove: T) {
    onChange(values.filter((item) => getKey(item) !== getKey(itemToRemove)));
  }

  return (
    <div ref={boxRef} className={["relative", className ?? ""].join(" ")}>
      {showLabel && (
        <label className="text-xs font-medium text-gray-300">{label}</label>
      )}

      <div className="flex items-end gap-2 mt-1">
        <div className="relative flex-1">

          {/* Search field */}
          <div
            className={[
              "relative rounded-xl border border-dashed",
              "bg-white/3 transition-colors",
              "focus-within:border-custom-sand-dune",
              "focus-within:bg-white/6",
              error ? "border-red-500" : "border-white/30",
            ].join(" ")}
          >
            <div className="flex items-center px-3">
              <Search size={17} className="text-gray-400 shrink-0" />

              <input
                className={[
                  "w-full bg-transparent text-sm text-white",
                  "px-3 py-3 outline-none",
                  "placeholder:text-gray-500",
                ].join(" ")}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(true);
                  setSelectedItem(null);
                }}
                onFocus={() => {
                  setOpen(true);

                  if (options.length === 0) {
                    void loadOptions("");
                  }
                }}
                placeholder={t("searchAndSelect")}
              />

              {loading && (
                <RotateCw
                  className="animate-spin text-custom-sand-dune shrink-0"
                  size={17}
                />
              )}
            </div>
          </div>

          {/* Dropdown */}
          {open && (
            <div
              className="absolute z-20 mt-2 w-full overflow-hidden
      rounded-xl border border-white/15 bg-gray-800 shadow-xl"
            >
              <div className="px-3 py-2 border-b border-white/10">
                <span
                  className="text-[10px] uppercase tracking-wider
          text-gray-500 font-semibold"
                >
                  {t("availableOptions")}
                </span>
              </div>

              <div className="max-h-60 overflow-auto p-1.5">
                {!loading && options.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-gray-500 text-center">
                    {t("errors.noResults")}
                  </div>
                ) : (
                  options.map((item) => (
                    <button
                      key={getKey(item)}
                      type="button"
                      onClick={() => {
                        setSelectedItem(item);
                        setQuery(getName(item));
                        setOpen(false);
                      }}
                      className="flex items-center justify-between w-full
                rounded-lg px-3 py-2.5 text-left
                hover:bg-white/10 transition-colors"
                    >
                      <span className="text-sm text-gray-200">
                        {getName(item)}
                      </span>

                      <Plus size={16} className="text-custom-sand-dune" />
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={addItem}
          disabled={!selectedItem}
          className="h-11 px-3 rounded-lg bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700"
        >
          <Plus size={18} />
        </button>
      </div>

      {values.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400">
              {t("selectedItems")}
            </span>

            <span className="text-[10px] text-gray-500">{values.length}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {values.map((item) => (
              <div
                key={getKey(item)}
                className="flex items-center gap-2 rounded-full
            border border-custom-sand-dune/30
            bg-custom-sand-dune/10 px-3 py-1.5"
              >
                <span className="text-xs text-custom-sand-dune">
                  {getName(item)}
                </span>

                <button
                  type="button"
                  onClick={() => removeItem(item)}
                  className="text-custom-sand-dune/70
              hover:text-red-400 transition-colors"
                >
                  <SquareX size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {error && (
        <p className="text-red-400 text-xs mt-1.5 font-medium animate-pulse">
          {error}
        </p>
      )}
    </div>
  );
}
