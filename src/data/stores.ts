// Store network behind the Retail & Inventory Agent.
// Distances, hours, stock and technician capacity are fixed per store so the
// agent's answers are deterministic — the same question always gets the same
// store, which is what a demo needs.

export type StoreCapability = "swap" | "repair" | "battery";

export type Store = {
  id: string;
  name: string;
  address: string;
  miles: number;
  hours: string;
  capabilities: StoreCapability[];
  /** Free technician slots today, in the order they'd be offered. */
  slots: string[];
  /** Device model names this store has replacement stock for. */
  stock: string[];
  /** Same-day repair capacity — drives the "walk in and wait" promise. */
  benchOpen: boolean;
};

export const STORES: Store[] = [
  {
    id: "st-winterpark",
    name: "AT&T Winter Park",
    address: "501 N Orlando Ave, Winter Park, FL",
    miles: 0.8,
    hours: "Open until 8:00 PM",
    capabilities: ["swap", "repair", "battery"],
    slots: ["11:15 AM", "11:45 AM", "12:15 PM", "1:00 PM", "2:30 PM"],
    stock: [
      "iPhone 17 Pro Max",
      "iPhone 17",
      "iPhone 16",
      "Galaxy S26 Ultra",
      "Pixel 10 Pro",
      "iPhone 17e",
    ],
    benchOpen: true,
  },
  {
    id: "st-maitland",
    name: "AT&T Maitland Centre",
    address: "1901 Summit Tower Blvd, Maitland, FL",
    miles: 2.4,
    hours: "Open until 7:00 PM",
    capabilities: ["swap", "battery"],
    slots: ["12:00 PM", "1:30 PM", "3:15 PM", "4:45 PM"],
    stock: ["iPhone 17 Pro Max", "iPhone 16", "Galaxy Z Fold7", "Galaxy S26 Ultra"],
    benchOpen: false,
  },
  {
    id: "st-altamonte",
    name: "AT&T Altamonte Springs",
    address: "451 E Altamonte Dr, Altamonte Springs, FL",
    miles: 4.1,
    hours: "Open until 8:00 PM",
    capabilities: ["swap", "repair", "battery"],
    slots: ["11:00 AM", "2:00 PM", "3:45 PM", "5:30 PM"],
    stock: ["iPhone 17", "iPhone 17e", "Pixel 10 Pro", "iPhone 16", "Galaxy Z Fold7"],
    benchOpen: true,
  },
];

/** Home-repair technician coverage — drives the "we come to you" option. */
export const HOME_REPAIR = {
  available: true,
  windows: ["Today, 2:00 – 4:00 PM", "Today, 4:00 – 6:00 PM", "Tomorrow, 9:00 – 11:00 AM"],
  etaMinutes: 30,
};
