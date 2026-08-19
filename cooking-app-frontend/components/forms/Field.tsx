export default function Field({
  type = "text",
  label,
  value,
  onChange,
  placeholder,
  className,
  isDisabled = false,
}: {
  type?: string;
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  isDisabled?: boolean;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        <label className="text-xs font-medium text-gray-300">{label}</label>
      )}

      <input
        type={type === "decimal" ? "text" : type}
        inputMode={type === "decimal" ? "decimal" : undefined}
        className="mt-1 h-10 w-full rounded-lg border bg-white/10 text-sm text-white border-white/20 outline-none px-3 focus:ring-2 focus:ring-black/10"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={isDisabled}
      />
    </div>
  );
}
