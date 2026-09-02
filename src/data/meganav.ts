// The att.com mega-nav, transcribed from the live header markup.
//
// Every rail, quick-action row, column heading and link below is what att.com
// actually ships today — the structure is theirs, so the shell around DeviceFlex
// reads as the real site rather than an approximation of it. `to` marks the
// links this prototype actually resolves; the rest are inert like the rest of
// the shell.

export type MegaLink = { label: string; to?: string };

export type MegaPanel = {
  /** Left-rail label for this panel. */
  rail: string;
  /** Heading over the quick-action row, e.g. "Quick actions" / "New arrivals". */
  quickLabel?: string;
  quick?: MegaLink[];
  columns: { heading: string; links: MegaLink[] }[];
  /** Image path for the promo card — served from /public, so it matches the copy. */
  promo?: { image: string; copy: string; cta: string };
};

export type MegaMenu = { title: string; panels: MegaPanel[] };

export const MEGA_NAV: Record<string, MegaMenu> = {
  Shop: {
    title: "Shop",
    panels: [
      {
        rail: "Plans & services",
        quickLabel: "Quick actions",
        quick: [
          { label: "Upgrade" },
          { label: "Add a line" },
          { label: "Bring your own phone" },
          { label: "Switch & save" },
        ],
        columns: [
          {
            heading: "Bundles",
            links: [
              { label: "Explore bundles" },
              { label: "AT&T OneConnect" },
              { label: "Internet + wireless" },
              { label: "Internet + home phone" },
              { label: "Customers 55+" },
            ],
          },
          {
            heading: "Wireless",
            links: [
              { label: "Explore wireless" },
              { label: "Phone plans", to: "/buy/plan" },
              { label: "Build-A-Plan" },
              { label: "Network coverage" },
              { label: "Prepaid" },
              { label: "International add-ons" },
              { label: "Connected car" },
            ],
          },
          {
            heading: "Home internet",
            links: [
              { label: "Explore home internet" },
              { label: "Check availability" },
              { label: "AT&T Fiber" },
              { label: "AT&T Internet Air" },
              { label: "Home phone" },
            ],
          },
        ],
        promo: {
          image: "/att/devices/apple-iphone-17-pro/cosmic-orange-hero.webp",
          copy: "Save big on everything back-to-school",
          cta: "Shop deals",
        },
      },
      {
        rail: "Devices & accessories",
        quickLabel: "New arrivals",
        quick: [
          { label: "Samsung Galaxy Z Fold8", to: "/buy/phones" },
          { label: "iPhone 17 Pro", to: "/buy/phones" },
          { label: "AirPods Pro 3" },
          { label: "Google Pixel 11 Pro", to: "/buy/phones" },
        ],
        columns: [
          {
            heading: "Devices",
            links: [
              { label: "Phones", to: "/buy/phones" },
              { label: "Prepaid phones" },
              { label: "Tablets" },
              { label: "Smartwatches" },
              { label: "AT&T Certified Pre-Owned" },
            ],
          },
          {
            heading: "Accessories",
            links: [
              { label: "Shop all accessories", to: "/buy/addons" },
              { label: "Cases" },
              { label: "Chargers" },
              { label: "Screen protectors" },
              { label: "Headphones" },
            ],
          },
          {
            heading: "Brands",
            links: [
              { label: "Apple" },
              { label: "Samsung" },
              { label: "Motorola" },
              { label: "Google" },
              { label: "Meta" },
            ],
          },
        ],
        promo: {
          image: "/att/devices/samsung-galaxy-z-fold8/graphite-hero.png",
          copy: "Get the new Samsung Galaxy Z Fold8 for $0 with eligible trade-in",
          cta: "Shop now",
        },
      },
    ],
  },

  Deals: {
    title: "Deals",
    panels: [
      {
        rail: "New & featured",
        quickLabel: "Featured",
        quick: [
          { label: "Shop all deals" },
          { label: "Wireless deals" },
          { label: "Internet deals" },
          { label: "Trade-in offers" },
          { label: "No trade-in offers" },
        ],
        columns: [
          {
            heading: "Trending deals",
            links: [
              { label: "Samsung Galaxy", to: "/buy/phones" },
              { label: "Apple iPhone", to: "/buy/phones" },
              { label: "Under $50" },
              { label: "Back-to-school deals" },
            ],
          },
          {
            heading: "Device & accessory deals",
            links: [
              { label: "Phones", to: "/buy/phones" },
              { label: "Prepaid phones" },
              { label: "Tablets" },
              { label: "Smartwatches" },
              { label: "Accessory deals", to: "/buy/addons" },
            ],
          },
          { heading: "Subscriptions", links: [{ label: "AT&T OneConnect" }] },
        ],
        promo: {
          image: "/att/devices/samsung-galaxy-s26-ultra/black-hero.png",
          copy: "Switch to AT&T and learn how to get up to $800/line to break your contract",
          cta: "See offer details",
        },
      },
      {
        rail: "Customer discounts",
        columns: [
          {
            heading: "Discounts by occupation",
            links: [
              { label: "Business employees" },
              { label: "Military & veterans" },
              { label: "Teachers" },
              { label: "Nurses & physicians" },
              { label: "Active responders" },
            ],
          },
          {
            heading: "Discounts by affiliation",
            links: [
              { label: "Customers 55+" },
              { label: "Retired responders" },
              { label: "Union workers" },
              { label: "Students" },
            ],
          },
          {
            heading: "Partner savings",
            links: [
              { label: "Credit card discount" },
              { label: "&More Benefits", to: "/myatt/perks" },
              { label: "AT&T Difference" },
            ],
          },
        ],
      },
    ],
  },

  "AT&T Difference": {
    title: "AT&T Difference",
    panels: [
      {
        rail: "Our competitive edge",
        columns: [
          {
            heading: "Why choose us",
            links: [
              { label: "AT&T Guarantee" },
              { label: "Why AT&T" },
              { label: "AT&T vs. T-Mobile & Verizon" },
              { label: "AT&T Fiber vs. Spectrum & Xfinity" },
              { label: "Try AT&T for free" },
              { label: "Switch & save" },
            ],
          },
          {
            heading: "Exceptional coverage",
            links: [{ label: "5G coverage map" }, { label: "Fiber coverage map" }],
          },
        ],
        promo: {
          image: "/att/misc/att-guarantee.jpg",
          copy: "America's best guarantee",
          cta: "Learn more",
        },
      },
      {
        rail: "Our sponsorships",
        columns: [
          {
            heading: "Sports",
            links: [{ label: "Soccer" }, { label: "Basketball" }, { label: "Golf" }],
          },
          { heading: "Music, Arts & Culture", links: [{ label: "Music" }] },
        ],
      },
    ],
  },

  Support: {
    title: "Support",
    panels: [
      {
        rail: "Bill & account",
        quickLabel: "Quick actions",
        quick: [
          { label: "View all support" },
          { label: "Go to my account", to: "/myatt" },
          { label: "Payment center" },
          { label: "Billing center" },
        ],
        columns: [
          {
            heading: "Bill & payments",
            links: [
              { label: "Understand your bill" },
              { label: "Find out why your bill changed" },
              { label: "Set up and manage AutoPay" },
              { label: "View device installments" },
              { label: "Pay without signing in" },
            ],
          },
          {
            heading: "Account",
            links: [
              { label: "Change or reset password" },
              { label: "Add or remove accounts" },
              { label: "Move internet service" },
              { label: "View my orders and claims", to: "/myatt/claims/new" },
              { label: "More account help" },
            ],
          },
        ],
      },
      {
        rail: "Wireless",
        quickLabel: "Quick actions",
        quick: [
          { label: "Manage my wireless service", to: "/myatt" },
          { label: "Track my order" },
          { label: "Add AT&T International Day Pass" },
        ],
        columns: [
          {
            heading: "My device",
            links: [
              { label: "Check my usage" },
              { label: "Manage add-ons", to: "/myatt/protection" },
              { label: "Change my plan" },
              { label: "Add a line" },
              { label: "Check upgrade eligibility" },
              { label: "Activate a wireless device" },
            ],
          },
          {
            heading: "Device options",
            links: [
              { label: "Manage eSIM" },
              { label: "Suspend wireless service" },
              { label: "Transfer a number to AT&T" },
              { label: "Change phone number" },
              { label: "Unlock a device" },
            ],
          },
          {
            heading: "Wireless help",
            links: [
              { label: "Check for outages" },
              { label: "Use device hotspot" },
              { label: "Device protection & warranty", to: "/deviceflex" },
              { label: "More wireless help" },
            ],
          },
        ],
      },
      {
        rail: "Internet",
        quickLabel: "Quick actions",
        quick: [
          { label: "Manage my internet service" },
          { label: "Track my order" },
          { label: "Get help moving" },
        ],
        columns: [
          {
            heading: "Equipment",
            links: [
              { label: "Restart a gateway" },
              { label: "Find Wi-Fi info" },
              { label: "Run internet speed test" },
              { label: "Set up Internet Air" },
            ],
          },
          {
            heading: "Troubleshooting",
            links: [
              { label: "Check for outages" },
              { label: "Manage appointments" },
              { label: "Optimize connection" },
              { label: "More internet help" },
            ],
          },
        ],
      },
    ],
  },
};
