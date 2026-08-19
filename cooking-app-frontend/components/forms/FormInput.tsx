// components/ui/FormInput.tsx
type FormInputProps = {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
};

export default function FormInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  error,
  className = "",
  required = false,
  disabled = false,
}: FormInputProps) {
  return (
    <div className={`mb-4 ${className}`}>
      <label htmlFor={id} className="block text-custom-sand-dune mb-2 font-medium">
        {label}:
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        className={`w-full text-gray-300 border rounded-2xl p-2 ${error ? 'border-red-500' : 'border-white/20'}`}
        required={required}
        disabled={disabled}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
