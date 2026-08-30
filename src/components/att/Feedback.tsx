// AT&T feedback surfaces: status pills, inline alerts, progress, loading and
// empty states.
//
// These are the pieces a prototype usually improvises per screen, which is how a
// product ends up with four different "covered" badges. Everything here is one
// definition with a fixed set of tones (info / success / warning / danger /
// neutral) mapped to the semantic tokens.
import type { ReactNode } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type Tone = "info" | "success" | "warning" | "danger" | "neutral";

const TONE: Record<Tone, { fg: string; bg: string; border: string }> = {
  info: {
    fg: "var(--color-att-link)",
    bg: "var(--color-att-pale-2)",
    border: "var(--color-att-navy)",
  },
  success: { fg: "var(--color-att-success)", bg: "#EAF7EE", border: "var(--color-att-success)" },
  warning: { fg: "var(--color-att-warning)", bg: "#FDF3E3", border: "var(--color-att-warning)" },
  danger: { fg: "var(--color-att-danger)", bg: "#FDE9EE", border: "var(--color-att-danger)" },
  neutral: {
    fg: "var(--color-att-ink-2)",
    bg: "var(--color-att-gray)",
    border: "var(--color-att-muted)",
  },
};

const TONE_ICON: Record<Tone, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertCircle,
  neutral: Info,
};

export function StatusPill({
  tone = "neutral",
  icon,
  children,
  className,
}: {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const t = TONE[tone];
  return (
    <span className={cn("att-status", className)} style={{ color: t.fg, backgroundColor: t.bg }}>
      {icon}
      {children}
    </span>
  );
}

export function Alert({
  tone = "info",
  title,
  children,
  icon = true,
  className,
}: {
  tone?: Tone;
  title?: ReactNode;
  children?: ReactNode;
  icon?: boolean;
  className?: string;
}) {
  const t = TONE[tone];
  const Icon = TONE_ICON[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "note"}
      className={cn("att-alert", className)}
      style={{ backgroundColor: t.bg, borderLeftColor: t.border }}
    >
      {icon && (
        <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0" style={{ color: t.fg }} aria-hidden />
      )}
      <div className="min-w-0">
        {title && <p className="font-bold">{title}</p>}
        {children && (
          <div className={cn(title && "mt-1", "text-[var(--color-att-ink-2)]")}>{children}</div>
        )}
      </div>
    </div>
  );
}

export function Progress({
  value,
  max = 100,
  tone = "info",
  label,
  valueLabel,
  className,
}: {
  value: number;
  max?: number;
  tone?: Tone;
  label?: ReactNode;
  valueLabel?: ReactNode;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const fill = tone === "info" ? "var(--color-att-navy)" : TONE[tone].fg;
  return (
    <div className={className}>
      {(label || valueLabel) && (
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          {label && <span className="text-sm font-bold">{label}</span>}
          {valueLabel && <span className="att-small">{valueLabel}</span>}
        </div>
      )}
      <div
        className="att-progress-track"
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div className="att-progress-bar" style={{ width: `${pct}%`, backgroundColor: fill }} />
      </div>
    </div>
  );
}

export function Spinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <Loader2
      role="status"
      aria-label={label}
      className={cn("h-5 w-5 animate-spin text-[var(--color-att-navy)]", className)}
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("att-skeleton h-4 w-full", className)} />;
}

export function EmptyState({
  icon,
  title,
  children,
  action,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid place-items-center rounded-2xl border border-dashed border-[var(--color-att-border)] bg-white px-6 py-12 text-center",
        className,
      )}
    >
      <div className="max-w-sm">
        {icon && (
          <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-[var(--color-att-pale-2)] text-[var(--color-att-link)]">
            {icon}
          </span>
        )}
        <p className="att-h4">{title}</p>
        {children && <p className="att-body mt-1.5 text-[var(--color-att-ink-3)]">{children}</p>}
        {action && <div className="mt-5 flex justify-center">{action}</div>}
      </div>
    </div>
  );
}
