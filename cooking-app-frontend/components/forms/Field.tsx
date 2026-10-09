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
}: {
  id: string;
  type?: string;
  label?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
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
      {error && (
        <p className="text-red-400 text-xs mt-1.5 font-medium animate-pulse">
          {error}
        </p>
      )}
    </div>
  );
}
