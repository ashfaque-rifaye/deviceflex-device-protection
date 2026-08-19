// AT&T form field with a floating label.
//
// The float is CSS-only, keyed off :placeholder-shown rather than React state.
// That matters more than it looks: autofill, browser back-restore and programmatic
// value writes never fire the events a state-driven float relies on, so those are
// exactly the cases where a JS float leaves the label sitting on top of the value.
//
// Focus adds an inset ring rather than thickening the border, so nothing shifts by
// a pixel when you click in.
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "placeholder"> & {
  label: string;
  /** Shown under the field in grey; replaced by `error` when present. */
  hint?: ReactNode;
  error?: string;
  className?: string;
};

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, hint, error, className, id, required, ...rest },
  ref,
) {
  const auto = useId();
  const inputId = id ?? auto;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className={className}>
      <div className="att-field">
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          /* A single space keeps :placeholder-shown meaningful while rendering
             nothing — the input's own ::placeholder is transparent. */
          placeholder=" "
          className={cn("att-field-input", error && "att-field-error")}
          {...rest}
        />
        <label htmlFor={inputId} className="att-field-label">
          {label}
          {required && (
            <span aria-hidden="true" className="ml-0.5 text-[var(--color-att-danger)]">
              *
            </span>
          )}
        </label>
      </div>

      {error ? (
        <p
          id={`${inputId}-error`}
          role="alert"
          className="mt-1.5 flex items-start gap-1.5 text-[13px] text-[var(--color-att-danger)]"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="att-small mt-1.5">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
