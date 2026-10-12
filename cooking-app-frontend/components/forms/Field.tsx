import React from "react";

export default function Field({
  id,
  type = "text",
  label,
  value,
  onChange,
  error,
  placeholder,
  className,
  isDisabled = false,
  rows,
}: {
  id?: string;
  type?: string;
  label?: string;
  value: string;
  onChange?: (v: string) => void;
  error?: string;
  placeholder?: string;
  className?: string;
  isDisabled?: boolean;
  rows?: number;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!onChange) return;
    let newValue = e.target.value;

    if (type === "decimal") {
      // Allows empty string, '-', '.', '.5', '123.', '123.45', and '-123.45'
      if (/^-?\d*\.?\d*$/.test(newValue)) {
        // Remove leading zeros from the integer part
        newValue = newValue.replace(/^(-?)0+(\d)/, "$1$2");
        onChange(newValue);
      }
      return;
    }

    onChange(newValue);
  };

  return (
    <div className={className}>
      {label && (
        <label className="text-xs font-medium text-gray-300 mb-1 block">
          {label}
        </label>
      )}

      {type === "textarea" ? (
        <textarea
          id={id}
          className={`
            w-full h-full rounded-xl border bg-white/5 p-3 text-sm text-white outline-none
            transition-all duration-200 placeholder:text-gray-500 disabled:opacity-50
            ${error 
              ? "border-red-500 focus:ring-2 focus:ring-red-500/50" 
              : "border-white/20 focus:border-custom-sand-dune focus:ring-2 focus:ring-custom-sand-dune/30 hover:bg-white/10"
            }
          `}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={isDisabled}
          rows={rows}
        />
      ) : type === "display" ? (
        <div 
          className={`
            flex justify-center mt-1 h-20 overflow-y-auto w-full rounded-xl border border-white/20 
            bg-gray-50/10 px-3 py-2 text-sm text-white whitespace-pre-wrap wrap-break-words
            ${isDisabled ? "opacity-50" : ""}
          `}
        >
          {value || placeholder}
        </div>
      ) : (
        <input
          id={id}
          type={type === "decimal" ? "text" : type}
          inputMode={type === "decimal" ? "decimal" : undefined}
          className={`
            w-full text-white bg-white/5 border rounded-xl px-4 py-2.5 
            transition-all duration-200 outline-none
            placeholder:text-gray-500 disabled:opacity-50
            ${error 
              ? "border-red-500 focus:ring-2 focus:ring-red-500/50" 
              : "border-white/20 focus:border-custom-sand-dune focus:ring-2 focus:ring-custom-sand-dune/30 hover:bg-white/10"
            }
          `}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={isDisabled}
        />
      )}

      {error && (
        <p className="text-red-400 text-xs mt-1.5 font-medium animate-pulse">
          {error}
        </p>
      )}
    </div>
  );
}