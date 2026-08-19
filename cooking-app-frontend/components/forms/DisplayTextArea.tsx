export default function DisplayTextArea({
  label,
  value,
  placeholder,
  className,
}: {
  rows?: number;
  label: string;
  value: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-xs font-medium text-gray-700">{label}</label>

      <div className="flex justify-center mt-1 h-20 overflow-y-auto w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm whitespace-pre-wrap wrap-break-words">
        {value || placeholder}
      </div>
    </div>
  );
}
