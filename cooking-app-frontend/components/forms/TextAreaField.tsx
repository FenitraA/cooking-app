export default function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  className,
}: {
  type?: string;
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && (
        <label className="text-xs font-medium text-gray-700">{label}</label>
      )}
      <textarea
        className="w-full h-full rounded-lg border border-white/20 bg-white/10 p-3 text-sm text-gray-300 outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
