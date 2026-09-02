import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The AT&T progress stepper — one definition, every flow.
 *
 * The buy flow and the claim flow used to ship two different steppers: a pill rail here
 * and a row of small numbered circles there. Nothing about a claim justifies a different
 * progress language from a purchase, and running two was the loudest reason the claim
 * page read as a different product.
 *
 * `leading` takes the section glyph. It renders in the pale-blue circle att.com uses for
 * semantic icons rather than bare, which is the small treatment that makes an icon read
 * as AT&T's rather than a generic lucide import.
 */
export function Stepper({
  steps,
  current,
  leading,
  className,
  label = "Progress",
}: {
  steps: string[];
  /** 0-based index of the active step. */
  current: number;
  leading?: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <ol
      aria-label={label}
      className={cn(
        "flex flex-wrap items-center gap-1 rounded-full border px-3 py-2",
        "border-[var(--color-att-border)] bg-[var(--color-att-surface)]",
        className,
      )}
    >
      {leading && (
        <li aria-hidden="true" className="mr-1">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--color-att-pale-2)] text-[var(--color-att-link)]">
            {leading}
          </span>
        </li>
      )}
      {steps.map((s, i) => {
        const active = i === current;
        const done = i < current;
        return (
          <li
            key={s}
            aria-current={active ? "step" : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs md:text-sm",
              active && "bg-[var(--color-att-pale-2)] font-bold text-[var(--color-att-link)]",
              done && "font-bold text-[var(--color-att-link)]",
              !active && !done && "text-[var(--color-att-ink-3)]",
            )}
          >
            {done ? (
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <span aria-hidden="true">{i + 1}.</span>
            )}
            {s}
          </li>
        );
      })}
    </ol>
  );
}
