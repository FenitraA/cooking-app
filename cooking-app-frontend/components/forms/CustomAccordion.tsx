"use client";

import { ReactNode, useState } from "react";
import { ChevronDown } from "lucide-react";

interface CustomAccordionProps {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}

export default function CustomAccordion({
  title,
  children,
  defaultOpen = false,
}: CustomAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-xl border border-custom-sand-dune/50">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="
          flex w-full items-center justify-between
          bg-custom-dark-blue
          p-4
          text-white
          transition-colors
          hover:bg-custom-dark-blue/90
          outline-none
        "
      >
        <div className="flex-1">{title}</div>

        <ChevronDown
          size={20}
          className={`hidden sm:block transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`
          grid transition-all duration-300 ease-in-out
          ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}
        `}
      >
        <div className="overflow-hidden">
          <div className="p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}