"use client";

import React, { useMemo } from "react";
import { formatWithCommas } from "@/lib/utils";

type Props = {
  label: string;
  amount_value: number;            // raw numeric from parent
  onChange: (raw: number) => void; // update parent raw numeric
  placeholder?: string;
  className?: string;
  isDisabled?: boolean;
};

export default function AmountField({
  label,
  amount_value,
  onChange,
  placeholder,
  className,
  isDisabled = false,
}: Props) {

  const formatted = useMemo(() => {
    return amount_value ? formatWithCommas(amount_value) : "";
  }, [amount_value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digitsOnly = e.target.value.replace(/[^\d]/g, "");
    onChange(digitsOnly ? Number(digitsOnly) : 0);
  }

  return (
    <div className={className}>
      <label className="text-xs font-medium text-gray-700">{label}</label>
      <input
        type="text"
        className="mt-1 h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
        value={formatted}
        data-raw-value={amount_value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={isDisabled}
        inputMode="numeric"
      />
    </div>
  );
}
