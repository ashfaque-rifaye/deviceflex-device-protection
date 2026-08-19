// Accessories eligible for the AT&T Protect Advantage annual accessory perk.
import caseFootball from "@/assets/case-football.jpg";
import casePattern from "@/assets/case-pattern.jpg";
import caseClear from "@/assets/case-clear.jpg";
import caseChrome from "@/assets/case-chrome.jpg";

export type AccessoryCategory = "Cases" | "Screen protectors" | "Chargers" | "Audio" | "Power";

export type Accessory = {
  id: string;
  name: string;
  brand: string;
  category: AccessoryCategory;
  retail: number; // normal price
  image?: string; // photo, when we have one
  icon?: "shield" | "plug" | "headphones" | "battery";
  compatible: "phones" | "all";
  eligible: boolean; // covered by the free annual perk
  note?: string;
};

export const ACCESSORIES: Accessory[] = [
  {
    id: "a1",
    name: "FIFA World Cup 26 Football Case",
    brand: "Casetify",
    category: "Cases",
    retail: 64,
    image: caseFootball,
    compatible: "phones",
    eligible: true,
  },
  {
    id: "a2",
    name: "FIFA World Cup 26 Pattern Case",
    brand: "Casetify",
    category: "Cases",
    retail: 64,
    image: casePattern,
    compatible: "phones",
    eligible: true,
  },
  {
    id: "a3",
    name: "Prism Grip MagSafe Case",
    brand: "Body Glove",
    category: "Cases",
    retail: 40,
    image: caseClear,
    compatible: "phones",
    eligible: true,
  },
  {
    id: "a4",
    name: "Presidio Perfect-Clear ClickLock Case",
    brand: "Speck",
    category: "Cases",
    retail: 55,
    image: caseChrome,
    compatible: "phones",
    eligible: true,
  },

  {
    id: "a5",
    name: "Glass Screen Protector",
    brand: "AT&T",
    category: "Screen protectors",
    retail: 34,
    icon: "shield",
    compatible: "phones",
    eligible: true,
  },
  {
    id: "a6",
    name: "Privacy Screen Protector",
    brand: "ZAGG",
    category: "Screen protectors",
    retail: 49,
    icon: "shield",
    compatible: "phones",
    eligible: true,
  },

  {
    id: "a7",
    name: "30W USB-C Fast Charger",
    brand: "AT&T",
    category: "Chargers",
    retail: 35,
    icon: "plug",
    compatible: "all",
    eligible: true,
  },
  {
    id: "a8",
    name: "3-in-1 Wireless Charging Stand",
    brand: "Belkin",
    category: "Chargers",
    retail: 89,
    icon: "plug",
    compatible: "all",
    eligible: false,
    note: "Above perk value — $49 with your credit",
  },

  {
    id: "a9",
    name: "Wired USB-C Earbuds",
    brand: "AT&T",
    category: "Audio",
    retail: 29,
    icon: "headphones",
    compatible: "all",
    eligible: true,
  },
  {
    id: "a10",
    name: "Beats Flex Wireless Earbuds",
    brand: "Beats",
    category: "Audio",
    retail: 69,
    icon: "headphones",
    compatible: "all",
    eligible: false,
    note: "Above perk value — $29 with your credit",
  },

  {
    id: "a11",
    name: "10,000 mAh Power Bank",
    brand: "AT&T",
    category: "Power",
    retail: 45,
    icon: "battery",
    compatible: "all",
    eligible: true,
  },
  {
    id: "a12",
    name: "MagSafe Battery Pack",
    brand: "Anker",
    category: "Power",
    retail: 79,
    icon: "battery",
    compatible: "phones",
    eligible: false,
    note: "Above perk value — $39 with your credit",
  },
];

export const CATEGORIES: AccessoryCategory[] = [
  "Cases",
  "Screen protectors",
  "Chargers",
  "Audio",
  "Power",
];
export const PERK_VALUE = 65; // max retail covered by one free accessory credit
