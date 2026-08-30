import { Check } from "lucide-react";
import { TIERS, type Tier } from "@/data/deviceflex";

export function TierCards({
  selected,
  onSelect,
  ctaLabel = "Select",
}: {
  selected?: Tier["id"];
  onSelect?: (id: Tier["id"]) => void;
  ctaLabel?: string;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {TIERS.map((t) => {
        const active = selected === t.id;
        return (
          <article
            key={t.id}
            className={`relative flex flex-col overflow-hidden rounded-2xl border bg-white p-6 transition ${
              active
                ? "border-[#00388F] shadow-[0_0_0_1.5px_#00388F]"
                : "border-[#DCDFE3] att-card-hover"
            }`}
          >
            <div className="flex h-6 items-start justify-end">
              {t.ribbon && (
                <span className="rounded-full bg-[#E7F5FB] px-3 py-1 text-[11px] font-bold leading-none text-[#0072B2]">
                  {t.ribbon}
                </span>
              )}
            </div>
            <p className="att-eyebrow mt-2">AT&amp;T Protect Advantage</p>
            <h3 className="att-h3 mt-1">{t.name}</h3>
            <p className="att-small mt-1">{t.devices}</p>
            <p className="mt-4 font-display text-[2rem] font-extrabold leading-none tracking-[-0.03em]">
              ${t.price}
              <span className="text-sm font-normal text-[#686E74]">/mo.</span>
            </p>
            <p className="att-body mt-2 min-h-[3.9rem] text-[#686E74]">{t.blurb}</p>

            <button
              onClick={() => onSelect?.(t.id)}
              className={active ? "btn-secondary mt-5 w-full" : "btn-primary mt-5 w-full"}
            >
              {active ? "Selected" : ctaLabel}
            </button>
            <ul className="mt-5 space-y-2 border-t border-[#DCDFE3] pt-5 text-sm">
              {t.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0072B2]" /> <span>{h}</span>
                </li>
              ))}
            </ul>
          </article>
        );
      })}
    </div>
  );
}
