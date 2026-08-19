"use client";

import { ComponentType, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}

export default function FilterSelect<T extends string>({
  value,
  onChange,
  options,
  placeholder,
  className,
  icon: Icon,
}: {
  value: T;
  onChange: (v: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  className?: string;
  icon?: ComponentType<{ className?: string; size?: number }>;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={["relative", className ?? ""].join(" ")}
    >
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[
          "h-10 min-w-50 w-full rounded-lg border border-white/20",
          "bg-white/10 text-gray-300 text-sm",
          "flex items-center justify-between",
          "cursor-pointer",
          "focus:ring-2 focus:ring-black/10",
          Icon ? "pl-9 pr-3" : "px-3",
        ].join(" ")}
      >
        {Icon && (
          <Icon
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
          />
        )}

        <span className="truncate">
          {selectedOption?.label ?? placeholder ?? ""}
        </span>

        <ChevronDown
          size={16}
          className={[
            "transition-transform",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="
            absolute
            z-50
            mt-1
            w-full
            overflow-hidden
            rounded-lg
            border
            border-white/20
            bg-custom-dark-blue
            shadow-lg
          "
        >
          {options.map((option) => {
            const selected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={[
                  "w-full text-left px-3 py-2 text-sm",
                  "transition-colors cursor-pointer",
                  selected
                    ? "bg-custom-sand-dune/20 text-custom-sand-dune"
                    : "text-white hover:bg-white/10",
                ].join(" ")}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}