// Onboarding coach marks.
//
// Modelled on the internal AT&T "DAD" onboarding pattern — a labelled progress bar, a
// short bold title, one instruction, and Back / Continue with an Exit always available —
// but on white rather than the near-black card, so it reads as part of att.com instead of
// as a separate tool.
//
// Two rules kept deliberately:
//   · Few steps. Three is a tour; eight is an obstacle. The component caps nothing, but
//     every call site here uses three or fewer.
//   · Shown once. It records completion in localStorage against `storageKey`, so a
//     returning member isn't taught the same screen twice. `?tour=1` forces it back for
//     a demo run.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { X, ArrowRight } from "lucide-react";

export type TourStep = {
  /** CSS selector for the element this step is about. Omitted = centred on screen. */
  target?: string;
  title: string;
  body: string;
  /** One concrete instruction, boxed the way the AT&T pattern does it. */
  hint?: string;
};

type Box = { top: number; left: number; width: number; height: number };

const CARD_W = 380;
const GAP = 14;

export function OnboardingTour({
  steps,
  storageKey,
  onDone,
}: {
  steps: TourStep[];
  storageKey: string;
  onDone?: () => void;
}) {
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);
  const [spot, setSpot] = useState<Box | null>(null);
  const card = useRef<HTMLDivElement>(null);

  // Decide whether to run at all. `?tour=1` overrides a previous completion so the tour
  // can be replayed on stage without clearing site data.
  useEffect(() => {
    try {
      const forced = new URLSearchParams(window.location.search).get("tour") === "1";
      if (forced || !localStorage.getItem(storageKey)) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, [storageKey]);

  const step = steps[i];

  // Measure the target after paint, and keep it correct through scroll and resize.
  useLayoutEffect(() => {
    if (!open || !step) return;
    const measure = () => {
      if (!step.target) {
        setSpot(null);
        return;
      }
      const el = document.querySelector(step.target);
      if (!el) {
        setSpot(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setSpot({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    // Bring the subject into view before measuring, or the card points off-screen.
    document.querySelector(step.target ?? "")?.scrollIntoView({ block: "center" });
    const t = setTimeout(measure, 260);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, step, i]);

  const finish = () => {
    try {
      localStorage.setItem(storageKey, "done");
    } catch {
      /* ignore */
    }
    setOpen(false);
    onDone?.();
  };

  if (!open || !step) return null;

  // Prefer below the target, flip above when there isn't room.
  const vh = typeof window === "undefined" ? 800 : window.innerHeight;
  const vw = typeof window === "undefined" ? 1200 : window.innerWidth;
  let style: React.CSSProperties;
  if (spot) {
    const below = spot.top + spot.height + GAP;
    const fitsBelow = below + 240 < vh;
    style = {
      top: fitsBelow ? below : Math.max(GAP, spot.top - 240 - GAP),
      left: Math.min(Math.max(GAP, spot.left), vw - CARD_W - GAP),
      width: CARD_W,
    };
  } else {
    style = {
      top: "50%",
      left: "50%",
      width: CARD_W,
      transform: "translate(-50%, -50%)",
    };
  }

  return (
    <>
      {/* Scrim. Light, because the point is to draw the eye — not to hide the page the
          member is being taught. The spotlight ring does the pointing. */}
      <div className="fixed inset-0 z-[80] bg-[#1D2329]/25" onClick={finish} aria-hidden />

      {spot && (
        <div
          className="pointer-events-none fixed z-[81] rounded-xl ring-4 ring-[#009FDB] ring-offset-2"
          style={{
            top: spot.top - 4,
            left: spot.left - 4,
            width: spot.width + 8,
            height: spot.height + 8,
          }}
          aria-hidden
        />
      )}

      <div
        ref={card}
        role="dialog"
        aria-label={step.title}
        className="fixed z-[82] rounded-2xl border border-[#DCDFE3] bg-white p-5 shadow-2xl"
        style={style}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="att-eyebrow">Getting started</p>
          <button
            onClick={finish}
            className="-mr-1 -mt-1 grid h-7 w-7 place-items-center rounded-full text-[#686E74] hover:bg-[#F3F4F6]"
            aria-label="Skip the tour"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2 h-1 w-full rounded-full bg-[#DCDFE3]">
          <div
            className="h-full rounded-full bg-[#009FDB] transition-[width] duration-300"
            style={{ width: `${((i + 1) / steps.length) * 100}%` }}
          />
        </div>

        <h3 className="mt-4 text-[20px] font-extrabold leading-tight">{step.title}</h3>
        <p className="mt-1.5 text-sm text-[#454B52]">{step.body}</p>

        {step.hint && (
          <p className="mt-3 rounded-xl bg-[#F2FAFD] p-3 text-sm font-bold text-[#1D2329]">
            {step.hint}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => setI((n) => Math.max(0, n - 1))}
            disabled={i === 0}
            className="text-sm font-bold text-[#0072B2] disabled:opacity-40"
          >
            Back
          </button>
          <span className="att-small">
            {i + 1} of {steps.length}
          </span>
          <button
            onClick={() => (i + 1 < steps.length ? setI(i + 1) : finish())}
            className="btn-primary att-btn-sm"
          >
            {i + 1 < steps.length ? (
              <>
                Continue <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              "Got it"
            )}
          </button>
        </div>
      </div>
    </>
  );
}
