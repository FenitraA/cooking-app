"use client";

import { useState, useRef, useEffect } from "react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import { format } from "date-fns";
import "react-day-picker/dist/style.css"; // Required for default calendar styling

export default function MultipleDateField({
  label,
  value = [],
  onChange,
  placeholder = "Select dates...",
  className = "",
  isDisabled = false,
}: {
  label?: string;
  value?: Date[];
  onChange: (v: Date[] | undefined) => void;
  placeholder?: string;
  className?: string;
  isDisabled?: boolean;
}) {
  const defaultClassNames = getDefaultClassNames();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close the calendar when the user clicks outside of the component
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Format the array of Date objects into a comma-separated string
  const displayValue =
    value && value.length > 0
      ? value.map((date) => format(date, "MMM d")).join(", ")
      : "";

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="mb-1 block text-xs font-medium text-gray-300">
          {label}
        </label>
      )}

      {/* 
        We use a <button> instead of <input> because standard inputs 
        cannot easily store Date arrays or block manual typing cleanly.
      */}
      <button
        type="button"
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
        disabled={isDisabled}
        className={`flex h-10 w-full items-center overflow-x-auto whitespace-nowrap rounded-lg border bg-white/10 px-3 text-sm outline-none transition-colors border-white/20 focus:ring-2 focus:ring-white/20 ${
          isDisabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer text-white"
        } ${!displayValue ? "text-gray-400" : "text-white"}`}
      >
        {displayValue || placeholder}
      </button>

      {/* Calendar Popover */}
      {isOpen && (
        <>
          {/* 1. Mobile Backdrop Overlay (Hidden on desktop) */}
          <div
            className="fixed inset-0 z-40 bg-black/60"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          />

          {/* 2. Calendar Container (Centered modal on mobile, dropdown on desktop) */}
          <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/20 bg-slate-900 p-2 shadow-xl">
            <DayPicker
              mode="multiple"
              selected={value}
              onSelect={onChange}
              className="text-gray-300"
              classNames={{
                today: `text-custom-sand-dune font-bold`,
                selected: `border border-custom-sand-dune`,
                root: `${defaultClassNames.root} shadow-lg p-5`,
                chevron: `fill-custom-sand-dune`,
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
