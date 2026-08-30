// AT&T tabs and accordion.
//
// Tabs are a real tablist (roving arrow-key focus, aria-selected) rather than a
// row of styled buttons, because the visual treatment — cyan 3px rule on a
// hairline track — is the part people copy and the keyboard model is the part
// they skip. The accordion is a full-width hairline row with the chevron hard
// right, matching att.com's FAQ and legal disclosure blocks.
import { useId, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type TabItem = { id: string; label: ReactNode; badge?: ReactNode };

export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const move = (dir: 1 | -1) => {
    const i = items.findIndex((t) => t.id === value);
    const next = items[(i + dir + items.length) % items.length];
    if (!next) return;
    onChange(next.id);
    refs.current[next.id]?.focus();
  };

  return (
    <div role="tablist" className={cn("att-tabs", className)}>
      {items.map((t) => {
        const on = t.id === value;
        return (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[t.id] = el;
            }}
            role="tab"
            type="button"
            aria-selected={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => {
              if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
              e.preventDefault();
              move(e.key === "ArrowRight" ? 1 : -1);
            }}
            className={cn("att-tab", on && "att-tab-on")}
          >
            {t.label}
            {t.badge != null && (
              <span className="ml-1.5 font-normal text-[var(--color-att-ink-3)]">({t.badge})</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function AccordionItem({
  title,
  children,
  defaultOpen = false,
}: {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className="border-b border-[var(--color-att-border)]">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="att-accordion-row"
      >
        <span>{title}</span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-[var(--color-att-link)] transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {open && (
        <div id={id} className="att-body pb-5 pr-8 pt-0 text-[var(--color-att-ink-2)]">
          {children}
        </div>
      )}
    </div>
  );
}

export function Accordion({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("border-t border-[var(--color-att-border)]", className)}>{children}</div>
  );
}
