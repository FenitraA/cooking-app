import React, { ComponentType } from "react";

type FieldIcon = ComponentType<{
  className?: string;
  size?: number;
}>;

interface FieldProps {
  id?: string;
  icon?: FieldIcon;
  type?: string;
  label?: string;
  value: string;
  onChange?: (value: string) => void;
  error?: string;
  placeholder?: string;
  className?: string;
  isDisabled?: boolean;
  rows?: number;
}

const BASE_FIELD_CLASSES = `
  w-full rounded-xl border bg-white/5 text-sm text-white
  outline-none transition-all duration-200
  placeholder:text-gray-500 disabled:opacity-50
`;

const FIELD_STATE_CLASSES = {
  error: "border-red-500 focus:ring-2 focus:ring-red-500/50",
  default:
    "border-white/20 focus:border-custom-sand-dune focus:ring-2 " +
    "focus:ring-custom-sand-dune/30 hover:bg-white/10",
};

const INPUT_CLASSES = `
  ${BASE_FIELD_CLASSES}
  px-3 py-2.5
`;

const TEXTAREA_CLASSES = `
  ${BASE_FIELD_CLASSES}
  p-3
  h-full
`;

const DISPLAY_CLASSES = `
  flex justify-center mt-1 w-full overflow-y-auto rounded-xl
  border border-white/20 bg-gray-50/10 px-3 py-2
  text-sm text-white whitespace-pre-wrap wrap-break-words
`;

function normalizeDecimal(value: string): string | null {
  // Allow intermediate values while the user is typing:
  // "", "-", ".", "-.", ".5", "123.", and "-123.45".
  if (!/^-?(?:\d*(?:\.\d*)?)$/.test(value)) {
    return null;
  }

  // Remove leading zeros without changing decimals such as 0.5.
  return value.replace(/^(-?)0+(\d)/, "$1$2");
}

export default function Field({
  id,
  icon: Icon,
  type = "text",
  label,
  value,
  onChange,
  error,
  placeholder,
  className = "",
  isDisabled = false,
  rows,
}: FieldProps) {
  const isTextarea = type === "textarea";
  const isDisplay = type === "display";
  const isDecimal = type === "decimal";
  const errorId = id ? `${id}-error` : undefined;

  const stateClasses = error
    ? FIELD_STATE_CLASSES.error
    : FIELD_STATE_CLASSES.default;

  const iconClasses = Icon ? "pl-9 pr-3" : "px-3";

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    if (!onChange) return;

    const newValue = event.target.value;

    if (isDecimal) {
      const normalizedValue = normalizeDecimal(newValue);

      if (normalizedValue !== null) {
        onChange(normalizedValue);
      }

      return;
    }

    onChange(newValue);
  }

  const commonProps = {
    id,
    value,
    onChange: handleChange,
    placeholder,
    disabled: isDisabled,
    "aria-invalid": !!error,
    "aria-describedby": error ? errorId : undefined,
  };

  return (
    <div className={["relative", className].filter(Boolean).join(" ")}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1 block text-xs font-medium text-gray-300"
        >
          {label}
        </label>
      )}

      {Icon && !isDisplay && (
        <Icon
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white"
        />
      )}

      {isDisplay ? (
        <div
          className={[
            DISPLAY_CLASSES,
            isDisabled ? "opacity-50" : "",
          ].join(" ")}
          aria-label={label}
        >
          {value || placeholder}
        </div>
      ) : isTextarea ? (
        <textarea
          {...commonProps}
          rows={rows}
          className={[
            TEXTAREA_CLASSES,
            stateClasses,
            iconClasses,
          ].join(" ")}
        />
      ) : (
        <input
          {...commonProps}
          type={isDecimal ? "text" : type}
          inputMode={isDecimal ? "decimal" : undefined}
          className={[
            INPUT_CLASSES,
            stateClasses,
            iconClasses,
          ].join(" ")}
        />
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 text-xs font-medium text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}