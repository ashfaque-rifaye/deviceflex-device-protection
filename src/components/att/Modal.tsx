// AT&T dialog and drawer.
//
// One overlay model for the whole prototype: 50% scrim, Escape closes, the body
// scroll locks while open, focus moves into the panel and the close control is a
// 40px icon button in the top-right. Actions sit in a footer that stacks on
// mobile with the primary action on top — the AT&T mobile arrangement, not the
// desktop right-aligned row shrunk down.
import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

function useOverlay(
  open: boolean,
  onClose: () => void,
  panel: React.RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, panel]);
}

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  /** Small grey line under the title. */
  eyebrow?: ReactNode;
  children: ReactNode;
  /** Footer actions. Stacked on mobile, right-aligned from sm up. */
  actions?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZE = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" } as const;

export function Modal({
  open,
  onClose,
  title,
  eyebrow,
  children,
  actions,
  size = "sm",
  className,
}: ModalProps) {
  const panel = useRef<HTMLDivElement>(null);
  useOverlay(open, onClose, panel);
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={cn(
          "max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white outline-none sm:rounded-2xl",
          SIZE[size],
          className,
        )}
        style={{ boxShadow: "var(--att-shadow-2)" }}
      >
        <div className="flex items-start gap-4 px-5 pt-5 sm:px-7 sm:pt-7">
          <div className="min-w-0 flex-1">
            {eyebrow && <p className="att-eyebrow">{eyebrow}</p>}
            {title && <h2 className="att-h3 mt-1">{title}</h2>}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="-mr-2 -mt-2 grid h-10 w-10 shrink-0 place-items-center rounded-full text-[var(--color-att-ink-2)] transition-colors hover:bg-[var(--color-att-gray)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4 sm:px-7">{children}</div>

        {actions && (
          <div className="flex flex-col-reverse gap-3 border-t border-[var(--color-att-border)] px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

/** Right-hand sheet on desktop, bottom sheet on mobile. Same chrome as Modal. */
export function Drawer({
  open,
  onClose,
  title,
  children,
  actions,
  className,
}: Omit<ModalProps, "size" | "eyebrow">) {
  const panel = useRef<HTMLDivElement>(null);
  useOverlay(open, onClose, panel);
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-end bg-black/50 sm:items-stretch"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={cn(
          "flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white outline-none sm:h-full sm:max-h-none sm:max-w-md sm:rounded-none",
          className,
        )}
        style={{ boxShadow: "var(--att-shadow-2)" }}
      >
        <div className="flex items-center gap-4 border-b border-[var(--color-att-border)] px-5 py-4">
          <h2 className="att-h4 min-w-0 flex-1">{title}</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="-mr-2 grid h-10 w-10 shrink-0 place-items-center rounded-full text-[var(--color-att-ink-2)] transition-colors hover:bg-[var(--color-att-gray)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {actions && (
          <div className="flex flex-col-reverse gap-3 border-t border-[var(--color-att-border)] px-5 py-4">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
