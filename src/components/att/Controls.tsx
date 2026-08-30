// AT&T selection and entry controls.
//
// One family, one set of dimensions: every control is 20px (24px for the switch)
// sitting in a 44px touch row, so a checkbox, a radio and a switch stacked in the
// same panel line up on the same left edge and the same rhythm. The visuals live
// in styles.css (`att-checkbox`, `att-radio`, `att-switch`, `att-select`,
// `att-textarea`) so every call site — including plain <input> markup that hasn't
// been migrated yet — picks up the same states.
import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ControlProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "children"> & {
  label: ReactNode;
  /** Secondary line under the label. */
  hint?: ReactNode;
  className?: string;
};

function control(kind: "checkbox" | "radio") {
  return forwardRef<HTMLInputElement, ControlProps>(function Control(
    { label, hint, className, id, ...rest },
    ref,
  ) {
    const auto = useId();
    const inputId = id ?? auto;
    return (
      <label htmlFor={inputId} className={cn("att-control-row", className)}>
        <input
          ref={ref}
          id={inputId}
          type={kind}
          className={kind === "checkbox" ? "att-checkbox" : "att-radio"}
          {...rest}
        />
        <span className="min-w-0">
          <span className="block text-sm leading-snug">{label}</span>
          {hint && <span className="att-small mt-0.5 block">{hint}</span>}
        </span>
      </label>
    );
  });
}

export const Checkbox = control("checkbox");
export const Radio = control("radio");

export type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  /** Visible label. Omit only when an aria-label is supplied instead. */
  label?: ReactNode;
  hint?: ReactNode;
  /** Label left, switch right — the AT&T settings-row arrangement. */
  align?: "start" | "between";
  className?: string;
};

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { label, hint, align = "between", className, id, ...rest },
  ref,
) {
  const auto = useId();
  const inputId = id ?? auto;
  const input = (
    <input ref={ref} id={inputId} type="checkbox" role="switch" className="att-switch" {...rest} />
  );

  if (!label) return <span className={className}>{input}</span>;

  return (
    <label
      htmlFor={inputId}
      className={cn(
        "att-control-row items-center",
        align === "between" && "justify-between",
        className,
      )}
    >
      <span className="min-w-0">
        <span className="block text-sm font-bold leading-snug">{label}</span>
        {hint && <span className="att-small mt-0.5 block font-normal">{hint}</span>}
      </span>
      {input}
    </label>
  );
});

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: ReactNode;
  error?: string;
  className?: string;
};

/** Native select in the AT&T field shell, so the option list stays platform-correct. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, className, id, children, ...rest },
  ref,
) {
  const auto = useId();
  const selectId = id ?? auto;
  return (
    <div className={className}>
      <div className="att-field">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          className={cn("att-select", error && "att-field-error")}
          {...rest}
        >
          {children}
        </select>
        <label htmlFor={selectId} className="att-field-label">
          {label}
        </label>
      </div>
      {error ? (
        <p role="alert" className="mt-1.5 text-[13px] text-[var(--color-att-danger)]">
          {error}
        </p>
      ) : hint ? (
        <p className="att-small mt-1.5">{hint}</p>
      ) : null}
    </div>
  );
});

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: ReactNode;
  className?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, className, id, ...rest },
  ref,
) {
  const auto = useId();
  const areaId = id ?? auto;
  return (
    <div className={className}>
      <label htmlFor={areaId} className="att-eyebrow mb-1.5 block">
        {label}
      </label>
      <textarea ref={ref} id={areaId} className="att-textarea" {...rest} />
      {hint && <p className="att-small mt-1.5">{hint}</p>}
    </div>
  );
});

export type SearchFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
  onClear?: () => void;
  className?: string;
};

/** Pill search with a leading glass and a clear affordance once there's a value. */
export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  { label = "Search", onClear, className, value, ...rest },
  ref,
) {
  return (
    <div
      className={cn(
        "flex h-12 items-center gap-2 rounded-full border border-[var(--color-att-ink-3)] bg-white px-4",
        "transition-colors focus-within:border-[var(--color-att-navy)] focus-within:shadow-[inset_0_0_0_1px_var(--color-att-navy)]",
        className,
      )}
    >
      <Search className="h-[18px] w-[18px] shrink-0 text-[var(--color-att-ink-3)]" aria-hidden />
      <input
        ref={ref}
        type="search"
        aria-label={label}
        placeholder={label}
        value={value}
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-att-ink-3)] [&::-webkit-search-cancel-button]:hidden"
        {...rest}
      />
      {onClear && String(value ?? "").length > 0 && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={onClear}
          className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[var(--color-att-ink-3)] hover:bg-[var(--color-att-gray)]"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
});
