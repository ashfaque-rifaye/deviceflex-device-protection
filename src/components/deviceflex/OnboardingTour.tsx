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
  /**
   * False until the first target has been measured. Without it the card mounts at
   * (0,0) — or at whatever the previous step's coordinates were — and then jumps, which
   * is the single ugliest thing a coach mark can do. Everything fades in from `ready`.
   */
  const [ready, setReady] = useState(false);
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
  // Call sites pass `steps` as an inline array literal, so `step` is a fresh object on
  // every render. Depending on the object restarts the measure effect continuously —
  // each run clearing the previous timeout, so it never settles and `ready` never
  // sticks. The target selector is a string, and a stable one, so depend on that.
  const target = step?.target;

  // Measure the target after paint, and keep it correct through scroll and resize.
  useLayoutEffect(() => {
    if (!open || !step) return;
    const measure = () => {
      if (!target) {
        setSpot(null);
        return;
      }
      const el = document.querySelector(target);
      if (!el) {
        setSpot(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setSpot({ top: r.top, left: r.left, width: r.width, height: r.height });
      setReady(true);
    };
    // Smooth-scroll the subject into view, then measure once it has settled. Measuring
    // during the scroll would read a position the element is about to leave.
    document.querySelector(target)?.scrollIntoView({
      block: "center",
      behavior: "smooth",
    });
    const t = setTimeout(measure, 420);
    // Re-measure live while the page moves, so the ring tracks its target rather than
    // detaching from it mid-scroll.
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, i, target]);

  // A step with no target has nothing to measure, so nothing would ever set `ready`.
  useEffect(() => {
    if (open && !target) setReady(true);
  }, [open, target]);

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
      <div
        className="fixed inset-0 z-[80] bg-[#1D2329]/25"
        style={{ opacity: ready ? 1 : 0, transition: "opacity 300ms ease" }}
        onClick={finish}
        aria-hidden
      />

      {/* The ring is rendered whether or not it has a measurement yet, so moving between
          steps animates its box from the old target to the new one instead of the ring
          disappearing and reappearing somewhere else. That travel is what makes the tour
          feel like one thing pointing at successive parts of the page. */}
      <div
        className="att-tour-ring pointer-events-none fixed z-[81] rounded-xl"
        style={{
          top: (spot?.top ?? vh / 2) - 4,
          left: (spot?.left ?? vw / 2) - 4,
          width: (spot?.width ?? 0) + 8,
          height: (spot?.height ?? 0) + 8,
          // The ring is an OUTLINE, not a Tailwind `ring-*`. Those compile to box-shadow,
          // which is the same property the pulse keyframes animate — the animation won
          // and silently erased the ring. Outline and box-shadow can coexist.
          outline: "4px solid #009FDB",
          outlineOffset: 2,
          // Inline rather than an `opacity-*` class so visibility never depends on which
          // utilities Tailwind happened to generate for this file.
          opacity: spot && ready ? 1 : 0,
          // Deliberately NOT transitioning opacity here. The ring re-measures on every
          // scroll event, and each re-render restarted the opacity transition from its
          // start value — leaving it pinned at 0 forever. The box properties transition
          // fine because their target keeps changing; opacity's does not.
          transition:
            "top 420ms cubic-bezier(0.4,0,0.2,1), left 420ms cubic-bezier(0.4,0,0.2,1), width 420ms cubic-bezier(0.4,0,0.2,1), height 420ms cubic-bezier(0.4,0,0.2,1)",
        }}
        aria-hidden
      />

      <div
        ref={card}
        role="dialog"
        aria-label={step.title}
        className="fixed z-[82] rounded-2xl border border-[#DCDFE3] bg-white p-5 shadow-2xl"
        style={{
          ...style,
          opacity: ready ? 1 : 0,
          transition:
            "top 420ms cubic-bezier(0.4,0,0.2,1), left 420ms cubic-bezier(0.4,0,0.2,1), opacity 300ms ease",
        }}
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
            className="h-full rounded-full bg-[#009FDB] transition-[width] duration-500 ease-out"
            style={{ width: `${((i + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Keyed on the step so React remounts it, which restarts the animation. The
            card itself glides to the next target; its contents fade in on arrival rather
            than swapping mid-flight. */}
        <div key={i} className="att-tour-content">
          <h3 className="mt-4 text-[20px] font-extrabold leading-tight">{step.title}</h3>
          <p className="mt-1.5 text-sm text-[#454B52]">{step.body}</p>

          {step.hint && (
            <p className="mt-3 rounded-xl bg-[#F2FAFD] p-3 text-sm font-bold text-[#1D2329]">
              {step.hint}
            </p>
          )}
        </div>

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
