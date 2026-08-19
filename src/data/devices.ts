// AT&T device catalog — images are real AT&T CDN assets downloaded into /public/att/devices.
// Referenced by absolute path (served from public/), so no import needed.

export type DeviceColor = { name: string; slug: string; hex: string; gallery: string[] };
export type Device = {
  slug: string;
  brand: string;
  name: string;
  badge?: string;
  price: string; // "as low as" monthly
  original: string; // struck-through monthly
  rating: string; // "4.1 | 24K"
  colors: DeviceColor[];
};

const HEX: Record<string, string> = {
  "cosmic-orange": "#C86B4A",
  "deep-blue": "#33405C",
  silver: "#D6D7D9",
  black: "#1b1b1d",
  "space-black": "#2a2a2d",
  "soft-pink": "#F2C9D1",
  jetblack: "#0b0b0b",
  obsidian: "#1f2023",
  "pantone-mountain-view": "#55705F",
};
const hex = (s: string) => HEX[s] ?? "#686E74";

export const DEVICES: Device[] = [
  {
    slug: "apple-iphone-17-pro-max",
    brand: "Apple",
    name: "iPhone 17 Pro Max",
    badge: "Save up to $1,100",
    price: "$2.78/mo.",
    original: "$33.34/mo.",
    rating: "4.1 | 24K",
    colors: [
      {
        name: "Cosmic Orange",
        slug: "cosmic-orange",
        hex: hex("cosmic-orange"),
        gallery: [
          "/att/devices/apple-iphone-17-pro-max/cosmic-orange-hero.webp",
          "/att/devices/apple-iphone-17-pro-max/cosmic-orange-1.webp",
          "/att/devices/apple-iphone-17-pro-max/cosmic-orange-2.webp",
          "/att/devices/apple-iphone-17-pro-max/cosmic-orange-3.webp",
          "/att/devices/apple-iphone-17-pro-max/cosmic-orange-4.webp",
          "/att/devices/apple-iphone-17-pro-max/cosmic-orange-5.webp",
          "/att/devices/apple-iphone-17-pro-max/cosmic-orange-6.webp",
          "/att/devices/apple-iphone-17-pro-max/cosmic-orange-7.webp",
        ],
      },
      {
        name: "Deep Blue",
        slug: "deep-blue",
        hex: hex("deep-blue"),
        gallery: ["/att/devices/apple-iphone-17-pro-max/deep-blue-hero.webp"],
      },
      {
        name: "Silver",
        slug: "silver",
        hex: hex("silver"),
        gallery: ["/att/devices/apple-iphone-17-pro-max/silver-hero.webp"],
      },
    ],
  },
  {
    slug: "apple-iphone-17-pro",
    brand: "Apple",
    name: "iPhone 17 Pro",
    badge: "$0 with trade-in",
    price: "$0.00/mo.",
    original: "$30.56/mo.",
    rating: "4.2 | 18K",
    colors: [
      {
        name: "Cosmic Orange",
        slug: "cosmic-orange",
        hex: hex("cosmic-orange"),
        gallery: ["/att/devices/apple-iphone-17-pro/cosmic-orange-hero.webp"],
      },
    ],
  },
  {
    slug: "apple-iphone-air",
    brand: "Apple",
    name: "iPhone Air",
    badge: "New",
    price: "$9.72/mo.",
    original: "$27.78/mo.",
    rating: "4.0 | 900",
    colors: [
      {
        name: "Space Black",
        slug: "space-black",
        hex: hex("space-black"),
        gallery: ["/att/devices/apple-iphone-air/space-black-hero.webp"],
      },
    ],
  },
  {
    slug: "apple-iphone-17",
    brand: "Apple",
    name: "iPhone 17",
    badge: "New lines only",
    price: "$2.22/mo.",
    original: "$22.22/mo.",
    rating: "4.5 | 5K",
    colors: [
      {
        name: "Black",
        slug: "black",
        hex: hex("black"),
        gallery: ["/att/devices/apple-iphone-17/black-hero.webp"],
      },
    ],
  },
  {
    slug: "apple-iphone-17e",
    brand: "Apple",
    name: "iPhone 17e",
    badge: "New lines only. No trade-in",
    price: "$0.43/mo.",
    original: "$16.67/mo.",
    rating: "4.0 | 3.2K",
    colors: [
      {
        name: "Soft Pink",
        slug: "soft-pink",
        hex: hex("soft-pink"),
        gallery: ["/att/devices/apple-iphone-17e/soft-pink-hero.png"],
      },
      {
        name: "Black",
        slug: "black",
        hex: hex("black"),
        gallery: ["/att/devices/apple-iphone-17e/black-hero.png"],
      },
    ],
  },
  {
    slug: "apple-iphone-16",
    brand: "Apple",
    name: "iPhone 16",
    price: "$2.43/mo.",
    original: "$22.22/mo.",
    rating: "4.4 | 41K",
    colors: [
      {
        name: "Black",
        slug: "black",
        hex: hex("black"),
        gallery: ["/att/devices/apple-iphone-16/black-hero.webp"],
      },
    ],
  },
  {
    slug: "samsung-galaxy-s26-ultra",
    brand: "Samsung",
    name: "Galaxy S26 Ultra",
    badge: "Any condition trade-in",
    price: "$5.56/mo.",
    original: "$36.11/mo.",
    rating: "4.3 | 12K",
    colors: [
      {
        name: "Black",
        slug: "black",
        hex: hex("black"),
        gallery: ["/att/devices/samsung-galaxy-s26-ultra/black-hero.png"],
      },
    ],
  },
  {
    slug: "samsung-galaxy-s26",
    brand: "Samsung",
    name: "Galaxy S26",
    badge: "$0 with trade-in",
    price: "$0.00/mo.",
    original: "$22.22/mo.",
    rating: "4.2 | 2K",
    colors: [
      {
        name: "Black",
        slug: "black",
        hex: hex("black"),
        gallery: ["/att/devices/samsung-galaxy-s26/black-hero.png"],
      },
    ],
  },
  {
    slug: "samsung-galaxy-z-fold7",
    brand: "Samsung",
    name: "Galaxy Z Fold7",
    badge: "Save up to $1,100",
    price: "$13.89/mo.",
    original: "$50.00/mo.",
    rating: "4.1 | 1K",
    colors: [
      {
        name: "Jetblack",
        slug: "jetblack",
        hex: hex("jetblack"),
        gallery: ["/att/devices/samsung-galaxy-z-fold7/jetblack-hero.webp"],
      },
    ],
  },
  {
    slug: "google-pixel-10-pro-xl",
    brand: "Google",
    name: "Pixel 10 Pro XL",
    badge: "New",
    price: "$8.34/mo.",
    original: "$30.56/mo.",
    rating: "4.3 | 800",
    colors: [
      {
        name: "Obsidian",
        slug: "obsidian",
        hex: hex("obsidian"),
        gallery: ["/att/devices/google-pixel-10-pro-xl/obsidian-hero.webp"],
      },
    ],
  },
  {
    slug: "google-pixel-10-pro",
    brand: "Google",
    name: "Pixel 10 Pro",
    badge: "$0 with trade-in",
    price: "$0.00/mo.",
    original: "$25.00/mo.",
    rating: "4.4 | 1.2K",
    colors: [
      {
        name: "Obsidian",
        slug: "obsidian",
        hex: hex("obsidian"),
        gallery: ["/att/devices/google-pixel-10-pro/obsidian-hero.webp"],
      },
    ],
  },
  {
    slug: "motorola-razr-plus-2026",
    brand: "Motorola",
    name: "razr+ 2026",
    badge: "New",
    price: "$5.56/mo.",
    original: "$27.78/mo.",
    rating: "4.0 | 400",
    colors: [
      {
        name: "Mountain View",
        slug: "pantone-mountain-view",
        hex: hex("pantone-mountain-view"),
        gallery: ["/att/devices/motorola-razr-plus-2026/pantone-mountain-view-hero.png"],
      },
    ],
  },
];

export const getDevice = (slug: string) => DEVICES.find((d) => d.slug === slug);
