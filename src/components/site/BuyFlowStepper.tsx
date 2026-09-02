import { Smartphone } from "lucide-react";
import { Stepper } from "@/components/att/Stepper";

const STEPS = [
  "Pick your device",
  "Customize your phone",
  "Choose your plan",
  "Get add-ons",
  "Review your cart",
];

/** The buy flow's stepper: the shared rail plus the flow's own checkout shortcut. */
export function BuyFlowStepper({ current }: { current: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Stepper
        steps={STEPS}
        current={current - 1}
        leading={<Smartphone className="h-4 w-4" />}
        label="Purchase progress"
        className="flex-1"
      />
      <button className="rounded-full border border-[var(--color-att-navy)] px-5 py-2.5 text-sm font-bold text-[var(--color-att-link)] hover:bg-[var(--color-att-pale-2)]">
        Checkout
      </button>
    </div>
  );
}
