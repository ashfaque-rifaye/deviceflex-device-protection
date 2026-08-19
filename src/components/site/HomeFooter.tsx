import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { AttGlobe } from "@/components/AttLogo";

export function HomeFooter() {
  return (
    <footer className="bg-[#1D2329] text-white">
      <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 lg:px-10">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          {[
            { h: "Shop", links: ["Wireless", "Phones", "Internet", "Accessories", "Deals"] },
            { h: "Support", links: ["Contact us", "Order status", "Repair", "Coverage map"] },
            { h: "About AT&T", links: ["Company info", "Careers", "Investor relations", "News"] },
          ].map((c) => (
            <div key={c.h}>
              <h4 className="text-base font-extrabold text-white">{c.h}</h4>
              <ul className="mt-4 space-y-3">
                {c.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-[#DCDFE3] hover:text-white">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h4 className="text-base font-extrabold text-white">Connect with us</h4>
            <div className="mt-4 flex gap-3">
              {[Facebook, Twitter, Instagram, Youtube].map((I, i) => (
                <a
                  key={i}
                  href="#"
                  className="grid h-10 w-10 place-items-center rounded-full border border-[#686E74] hover:border-white"
                >
                  <I className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-[#686E74] pt-6">
          <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <AttGlobe size={28} />
              <span className="text-xs text-[#DCDFE3]">
                © 2026 AT&amp;T Intellectual Property. All rights reserved.
              </span>
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#DCDFE3]">
              {[
                "Privacy Policy",
                "Terms of Use",
                "Accessibility",
                "California Privacy",
                "Your Privacy Choices",
              ].map((l) => (
                <li key={l}>
                  <a href="#" className="hover:text-white">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
