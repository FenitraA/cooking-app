import { ComponentType } from "react";

export default function FilterField({
  type,
  value,
  onChange,
  placeholder,
  className,
  icon: Icon,
}: {
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  icon?: ComponentType<{ className?: string; size?: number }>;
}) {
  return (
    <div className={["relative", className].join(" ")}>
      {Icon && (
        <Icon
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white"
        />
      )}
      <input
        type={type}
        className={[
          "h-10 w-full rounded-lg border bg-white/10 text-sm text-white border-white/20 outline-none",
          "focus:ring-2 focus:ring-black/10",
          Icon ? "pl-9 pr-3" : "px-3",
        ].join(" ")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
