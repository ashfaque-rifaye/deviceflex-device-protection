import { Smartphone } from "lucide-react";

const STEPS = [
  "Pick your device",
  "Customize your phone",
  "Choose your plan",
  "Get add-ons",
  "Review your cart",
];

export function BuyFlowStepper({ current }: { current: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-1 flex-wrap items-center gap-1 rounded-full border border-[#DCDFE3] bg-white px-3 py-2">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[#E7F5FB]">
          <Smartphone className="h-4 w-4 text-[#0057B8]" />
        </span>
        {STEPS.map((label, i) => {
          const n = i + 1;
          const active = n === current;
          const done = n < current;
          return (
            <span
              key={label}
              className={`rounded-full px-3 py-1.5 text-xs md:text-sm ${
                active
                  ? "bg-[#E7F5FB] font-bold text-[#0057B8]"
                  : done
                    ? "font-bold text-[#0057B8]"
                    : "text-[#686E74]"
              }`}
            >
              {n}. {label}
            </span>
          );
        })}
      </div>
      <button className="rounded-full border border-[#0057B8] px-5 py-2.5 text-sm font-bold text-[#0057B8] hover:bg-[#E7F5FB]">
        Checkout
      </button>
    </div>
  );
}
