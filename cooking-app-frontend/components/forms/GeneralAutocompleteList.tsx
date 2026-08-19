"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { SquareX, RotateCw, Plus } from "lucide-react";

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
  }, [query,loadOptions]);

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

      <div className="flex gap-2 mt-1">
        <div className="relative flex-1">
          <input
            className={[
              "h-10 w-full rounded-lg border bg-white/10 text-sm text-white border-white/20",
              "pl-3 pr-10 text-xs outline-none",
              "focus:ring-2 focus:ring-black/10",
              showShadow ? "shadow-hard-br" : "",
            ].join(" ")}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              setOpen(true);

              if (options.length === 0) {
                void loadOptions("");
              }
            }}
            placeholder={t("type_to_search")}
          />

          {loading && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <RotateCw className="animate-spin text-white" size={18} />
            </div>
          )}

          {open && (
            <div className="absolute z-20 mt-2 w-full rounded-lg bg-gray-800 shadow-sm overflow-hidden">
              <div className="max-h-60 overflow-auto">
                {!loading && options.length === 0 ? (
                  <div className="px-3 py-3 text-sm text-gray-500">
                    {t("errors.no_results")}
                  </div>
                ) : (
                  options.map((item, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSelectedItem(item);
                        setQuery(getName(item));
                        setOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-700 cursor-pointer border border-white/10"
                    >
                      <div className="font-medium text-gray-300">
                        {getName(item)}
                      </div>
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
          className="h-10 px-3 rounded-lg bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700"
        >
          <Plus size={18} />
        </button>
      </div>

      {values.length > 0 && (
        <div className="mt-3 space-y-2">
          {values.map((item) => (
            <div
              key={getKey(item)}
              className="flex items-center justify-between rounded-lg border border-white/20 bg-white/5 px-3 py-2"
            >
              <span className="text-sm text-gray-300">{getName(item)}</span>

              <button
                type="button"
                onClick={() => removeItem(item)}
                className="cursor-pointer"
              >
                <SquareX
                  size={18}
                  className="text-red-400 hover:text-red-300"
                />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
