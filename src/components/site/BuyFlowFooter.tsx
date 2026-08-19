import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import { AttGlobe } from "@/components/AttLogo";

export function BuyFlowFooter() {
  return (
    <footer className="bg-[#009FDB] text-white">
      <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-4 px-4 py-6 sm:px-6 md:flex-row md:items-center lg:px-10">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white p-1">
            <AttGlobe size={28} />
          </div>
          <span className="text-lg font-extrabold tracking-tight">AT&amp;T</span>
        </div>
        <div className="flex items-center gap-4">
          {[Twitter, Facebook, Instagram, Linkedin].map((I, i) => (
            <a
              key={i}
              href="#"
              aria-label="Social"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/70 hover:bg-white hover:text-[#009FDB]"
            >
              <I className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
