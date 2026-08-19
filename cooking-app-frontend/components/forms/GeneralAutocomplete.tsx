"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { SquareX, RotateCw } from "lucide-react";

import { UnauthorizedError } from "@/lib/errors";

type Props<T> = {
  translationsKey: string; // for the label and placeholder
  showShadow?: boolean;

  label?: string;
  value: T | null;
  onSelect: (item: T) => void;
  onClear: () => void;

  getName: (item: T) => string;
  fetchOptions: (query: string, signal?: AbortSignal) => Promise<T[]>;

  placeholder?: string;
  className?: string;
};

export default function GeneralAutocomplete<T>({
  translationsKey = "",
  showShadow = false,
  label,
  value,
  onSelect,
  onClear,
  getName,
  fetchOptions,
  className,
}: Props<T>) {
  const router = useRouter();
  const t = useTranslations(translationsKey);

  const [query, setQuery] = useState(value ? getName(value) : "");
  const [options, setOptions] = useState<T[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const boxRef = useRef<HTMLDivElement | null>(null);
  const clearedForSelectionRef = useRef(false);

  // AbortController for the latest in-flight request
  const abortRef = useRef<AbortController | null>(null);
  // Track mount status to avoid state updates after unmount
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    setQuery(value ? getName(value) : "");
  }, [value, getName]);

  // Close dropdown on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function loadOptions(q: string) {
    // cancel previous request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const items = await fetchOptions(q, controller.signal);
      // If this request was aborted or component unmounted, ignore
      if (controller.signal.aborted || !mountedRef.current) return;

      setOptions(items);
    } catch (e: unknown) {
      if (!mountedRef.current) return;

      // Ignore abort errors (normal during typing)
      if (e instanceof DOMException && e.name === "AbortError") return;

      if (e instanceof UnauthorizedError) {
        router.replace("/login");
        return;
      }

      setOptions([]);
    } finally {
      if (!mountedRef.current) return;
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  // Fetch when user types (debounced)
  useEffect(() => {
    const q = query.trim();

    if (value && q === getName(value)) return;

    const timer = setTimeout(() => {
      void loadOptions(q);
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, value, getName]);

  function handleChange(v: string) {
    setQuery(v);
    setOpen(true);

    if (!value) return;

    const typed = v.trim();
    const selected = value ? getName(value).trim() : "";

    if (!clearedForSelectionRef.current && typed !== selected) {
      clearedForSelectionRef.current = true;
      onClear();
    }
  }

  return (
    <div ref={boxRef} className={["relative", className].join(" ")}>
      {label && (
        <label className="text-xs font-medium text-gray-300">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          className={[
            "mt-1 h-10 w-full rounded-lg border bg-white/10 text-sm text-white border-white/20",
            "pl-3 pr-10 text-xs outline-none",
            "focus:ring-2 focus:ring-black/10",
            showShadow ? "shadow-hard-br" : "",
          ].join(" ")}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => {
            setOpen(true);
            if (options.length === 0) {
              void loadOptions(""); // default results
            }
          }}
          placeholder={t("type_to_search")}
        />

        {open && (
          <div className="absolute z-20 mt-2 w-full rounded-lg bg-gray-800 shadow-sm overflow-hidden">
            <div className="max-h-60 overflow-auto">
              {!loading && options.length === 0 ? (
                <div className="px-3 py-3 text-sm text-gray-500">
                  {t("errors.no_results")}
                </div>
              ) : (
                options.map((item,i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      onSelect(item);
                      setOpen(false);
                      setQuery(getName(item));
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-700 cursor-pointer border border-white/10"
                  >
                    <div className="font-medium text-gray-300">{getName(item)}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {value && (
          <button
            type="button"
            onClick={() => {
              onClear();
              setQuery("");
              setOptions([]);
              setOpen(false);
              abortRef.current?.abort();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-100"
            aria-label="Clear"
          >
            <SquareX size={24} />
          </button>
        )}

        {loading && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer">
            <RotateCw className="animate-spin text-white" size={18} />
          </div>
        )}
      </div>
    </div>
  );
}
