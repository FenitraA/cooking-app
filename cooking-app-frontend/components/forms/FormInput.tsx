interface FormInputProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function FormInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  error,
  className = "",
  required,
  disabled,
}: FormInputProps) {
  return (
    <div className={`mb-4 w-full ${className}`}>
      <label htmlFor={id} className="block text-custom-sand-dune mb-1.5 text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`
          w-full text-white bg-white/5 border rounded-xl px-4 py-2.5 
          transition-all duration-200 outline-none
          placeholder:text-gray-500 disabled:opacity-50
          ${error 
            ? "border-red-500 focus:ring-2 focus:ring-red-500/50" 
            : "border-white/20 focus:border-custom-sand-dune focus:ring-2 focus:ring-custom-sand-dune/30 hover:bg-white/10"
          }
        `}
      />
      {error && (
        <p className="text-red-400 text-xs mt-1.5 font-medium animate-pulse">
          {error}
        </p>
      )}
    </div>
  );
}