// AT&T-style info tip — a small (i) that opens a popover.
//
// att.com uses this shape wherever a field needs a sentence of explanation that isn't
// worth permanent space: the (?) beside "AT&T Wireless number" on the Profile page is the
// same control. Detail that is useful once and clutter thereafter belongs behind one.
//
// Behaviour worth keeping: click to toggle (not hover — hover popovers are unusable on
// touch and unreachable by keyboard), Escape to dismiss, click-outside to dismiss, and a
// real <button> so it lands in the tab order with a label screen readers can announce.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Info, X } from "lucide-react";

export function InfoTip({
  label,
  title,
  children,
  align = "right",
}: {
  /** Announced to screen readers — say what the tip explains, not "more info". */
  label: string;
  title?: string;
  children: ReactNode;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span ref={wrap} className="relative inline-flex">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="grid h-5 w-5 place-items-center rounded-full text-[#0072B2] transition-colors hover:bg-[#E7F5FB]"
      >
        <Info className="h-4 w-4" />
      </button>

      {open && (
        <span
          role="dialog"
          aria-label={label}
          // `normal-case tracking-normal` is load-bearing: these tips are usually placed
          // inside an `att-eyebrow`, which is uppercase with wide letter-spacing. Without
          // resetting both, the popover renders A WHOLE PARAGRAPH SHOUTED.
          className={`absolute top-7 z-50 block w-[min(20rem,calc(100vw-2.5rem))] rounded-xl border border-[#DCDFE3] bg-white p-4 text-left normal-case tracking-normal shadow-xl ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <span className="flex items-start justify-between gap-3">
            {title && <span className="text-sm font-extrabold text-[#1D2329]">{title}</span>}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="ml-auto grid h-5 w-5 shrink-0 place-items-center rounded-full text-[#686E74] hover:bg-[#F3F4F6]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
          <span className="mt-1.5 block">{children}</span>
        </span>
      )}
    </span>
  );
}
