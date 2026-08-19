import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import { AttGlobe } from "@/components/AttLogo";

const ROW1: [string, string[]][] = [
  [
    "Shop",
    [
      "Cell phones",
      "Fiber internet",
      "Home internet",
      "Tablets",
      "Smartwatches",
      "Wireless accessories",
      "Prepaid phones",
    ],
  ],
  [
    "Trending",
    [
      "iPhone 17 Pro Max",
      "iPhone 17 Pro",
      "iPhone Air",
      "iPhone 17",
      "Samsung Galaxy S26 Ultra",
      "Samsung Galaxy Z Fold7",
      "Samsung Galaxy Z Flip7",
    ],
  ],
  [
    "Top phone & data plans",
    [
      "Unlimited phone plans",
      "International plans",
      "Add a line",
      "Upgrade",
      "Tablet data plans",
      "Mobile hotspot plans",
      "Next Up Anytime",
    ],
  ],
  [
    "Switch to AT&T",
    [
      "Switch to AT&T",
      "How to switch phone carriers",
      "Internet speed test",
      "Bring your own device",
      "Cell phone trade-in",
      "Transfer your internet service",
    ],
  ],
  [
    "Featured deals",
    [
      "AT&T Deals & Promotions",
      "Cell phone deals",
      "iPhone deals",
      "Samsung deals",
      "Phone and internet bundle deals",
      "Credit card discount",
      "Free phone deals for new customers",
      "No trade-in deals",
    ],
  ],
];

const ROW2: [string, string[]][] = [
  [
    "Shop cell phones by brand",
    [
      "New Apple iPhones",
      "New Samsung Galaxy phones",
      "New Google Pixel phones",
      "New Motorola Moto phones",
      "New Sonim phones",
    ],
  ],
  [
    "Tablets & Watches",
    [
      "New Apple iPad",
      "New Samsung Galaxy Tab",
      "New Apple Watch",
      "New Samsung Galaxy Watch",
      "New Google Pixel Watch",
      "New Kids Smart Watch",
    ],
  ],
  [
    "Accessories by Brand",
    [
      "Apple accessories",
      "AT&T accessories",
      "Samsung accessories",
      "Otterbox phone cases",
      "Beats headphones",
    ],
  ],
  [
    "Resources",
    [
      "Bundle internet and wireless",
      "What is Internet Air?",
      "How to use your phone internationally",
      "What is fiber internet?",
      "What is eSIM?",
      "Return or exchange your wireless device",
      "What is wifi?",
    ],
  ],
  [
    "AT&T",
    [
      "Find a store",
      "Newsroom",
      "Investor Relations",
      "Corporate Responsibility",
      "Careers",
      "Help & info",
      "AT&T Guarantee",
      "Broadband Facts Machine Readable Files",
      "Screen share code",
    ],
  ],
];

const MID_LINKS = ["Techbuzz blog", "Feedback", "FREE AT&T Email with 1TB storage", "LLMs"];
const LEGAL = [
  "Site map",
  "Coverage maps",
  "Terms of use",
  "Accessibility",
  "Broadband details",
  "Legal policy center",
  "Advertising choices",
  "Privacy center",
  "Your Privacy Choices",
  "Health Privacy Notice",
  "Cyber Security",
  "FCC public files",
];

function Column({ h, links }: { h: string; links: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-extrabold text-[#1D2329]">{h}</h4>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l}>
            <a href="#" className="text-[13px] text-[#0057B8] hover:underline">
              {l}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer>
      {/* Blue brand bar */}
      <div className="bg-[#009FDB] text-white">
        <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-4 px-4 py-5 sm:px-6 md:flex-row md:items-center lg:px-10">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white p-1">
              <AttGlobe size={28} />
            </div>
            <span className="text-lg font-extrabold tracking-tight">AT&amp;T</span>
          </div>
          <div className="flex items-center gap-3">
            {[Twitter, Facebook, Instagram, Linkedin].map((I, i) => (
              <a
                key={i}
                href="#"
                aria-label="Social"
                className="grid h-9 w-9 place-items-center rounded-full border border-white/80 hover:bg-white hover:text-[#009FDB]"
              >
                <I className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Link grid */}
      <div className="bg-[#F2FAFD]">
        <div className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 lg:px-10">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {ROW1.map(([h, l]) => (
              <Column key={h} h={h} links={l} />
            ))}
          </div>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {ROW2.map(([h, l]) => (
              <Column key={h} h={h} links={l} />
            ))}
          </div>

          <div className="mt-10 border-t border-[#DCDFE3] pt-6">
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {MID_LINKS.map((l) => (
                <li key={l}>
                  <a href="#" className="text-sm font-bold text-[#0057B8] hover:underline">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
            {LEGAL.map((l) => (
              <li key={l}>
                <a href="#" className="text-xs text-[#686E74] hover:text-[#0057B8]">
                  {l}
                </a>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-xs text-[#686E74]">
            © 2026 AT&amp;T Intellectual Property. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
