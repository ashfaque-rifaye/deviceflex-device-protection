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
              active ? "border-[#0057B8] ring-2 ring-[#0057B8]/30" : "border-[#DCDFE3]"
            }`}
          >
            {t.ribbon && (
              <span className="absolute right-4 top-4 rounded-full bg-[#E7F5FB] px-3 py-1 text-[11px] font-bold text-[#0057B8]">
                {t.ribbon}
              </span>
            )}
            <p className="text-xs font-bold uppercase tracking-widest text-[#686E74]">
              AT&amp;T Protect Advantage
            </p>
            <h3 className="mt-1 text-2xl font-extrabold">{t.name}</h3>
            <p className="mt-1 text-sm text-[#686E74]">{t.devices}</p>
            <p className="mt-4 text-3xl font-extrabold">
              ${t.price}
              <span className="text-sm font-normal text-[#686E74]">/mo.</span>
            </p>
            <p className="mt-2 text-sm text-[#686E74]">{t.blurb}</p>
            <button
              onClick={() => onSelect?.(t.id)}
              className={active ? "btn-primary mt-5 w-full opacity-90" : "btn-primary mt-5 w-full"}
            >
              {active ? "Selected" : ctaLabel}
            </button>
            <ul className="mt-5 space-y-2 border-t border-[#DCDFE3] pt-5 text-sm">
              {t.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0057B8]" /> <span>{h}</span>
                </li>
              ))}
            </ul>
          </article>
        );
      })}
    </div>
  );
}
