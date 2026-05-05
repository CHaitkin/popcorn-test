// Single source of truth for the prototype.
// Data here is the spec dataset, not invented. Do not modify values.

export type Tier = "top-8" | "key" | "smaller";

export type Customer = {
  id: string;
  name: string;
  tier: Tier;
};

export type ContainerLine = {
  sku: string;
  itemName: string;
  yards: number;
};

export type Container = {
  id: string;
  eta: string; // ISO date — current/effective ETA
  // If the boss's Excel has shifted the ETA but customers haven't been notified
  // yet, the unshifted (originally-promised) ETA goes here. Janet sees both.
  // For Flow B demo: MAEU-7821 has originalEta = 2026-05-08, eta = 2026-05-11.
  originalEta?: string;
  lines: ContainerLine[];
};

export type Order = {
  id: string;
  customerId: string;
  sku: string;
  qty: number;
  orderDate: string; // ISO
  promisedEta: string; // ISO — what Janet has told the customer
};

// "Today" for the prototype. Tuesday, May 5, 2026.
export const TODAY = "2026-05-05";

export const CUSTOMERS: Customer[] = [
  { id: "maximus", name: "Maximus Living", tier: "top-8" },
  { id: "hartwell", name: "Hartwell Designs", tier: "top-8" },
  { id: "coronado", name: "Coronado Sofa Co", tier: "top-8" },
  { id: "brookhaven", name: "Brookhaven Upholstery", tier: "key" },
  { id: "eastlake", name: "Eastlake Furniture", tier: "key" },
  { id: "romero", name: "Romero Interiors", tier: "smaller" },
  { id: "fabricbook", name: "FabricBook Co", tier: "smaller" },
];

export const SKU_NAMES: Record<string, string> = {
  "SKU-2103": "Vinyl — Onyx",
  "SKU-2104": "Vinyl — Cream",
  "SKU-2105": "Vinyl — Slate Grey",
  "SKU-3001": "Chenille — Forest",
  "SKU-3002": "Chenille — Sand",
  "SKU-3003": "Chenille — Charcoal",
  "SKU-4001": "Velvet — Burgundy",
  "SKU-4002": "Velvet — Navy",
  "SKU-5001": "Linen — Natural",
  "SKU-5002": "Linen — Stone",
  "SKU-6001": "Tweed — Heather",
};

// Containers — exact data from the spec.
// MAEU-7821 has a pending ETA shift (May 8 → May 11) for Flow B.
export const CONTAINERS: Container[] = [
  {
    id: "MAEU-7821",
    originalEta: "2026-05-08",
    eta: "2026-05-11",
    lines: [
      { sku: "SKU-2103", itemName: "Vinyl — Onyx", yards: 8000 },
      { sku: "SKU-3001", itemName: "Chenille — Forest", yards: 4000 },
      { sku: "SKU-4001", itemName: "Velvet — Burgundy", yards: 2500 },
    ],
  },
  {
    id: "ONEU-5532",
    eta: "2026-05-22",
    lines: [
      { sku: "SKU-2103", itemName: "Vinyl — Onyx", yards: 5000 },
      { sku: "SKU-3002", itemName: "Chenille — Sand", yards: 6000 },
      { sku: "SKU-5001", itemName: "Linen — Natural", yards: 4000 },
    ],
  },
  {
    id: "MSCU-3344",
    eta: "2026-05-30",
    lines: [
      { sku: "SKU-2104", itemName: "Vinyl — Cream", yards: 10000 },
      { sku: "SKU-3001", itemName: "Chenille — Forest", yards: 3000 },
      { sku: "SKU-4002", itemName: "Velvet — Navy", yards: 3500 },
    ],
  },
  {
    id: "HMMU-9201",
    eta: "2026-06-05",
    lines: [
      { sku: "SKU-2105", itemName: "Vinyl — Slate Grey", yards: 7000 },
      { sku: "SKU-5002", itemName: "Linen — Stone", yards: 4500 },
      { sku: "SKU-6001", itemName: "Tweed — Heather", yards: 3500 },
    ],
  },
  {
    id: "COSU-1456",
    eta: "2026-06-12",
    lines: [
      { sku: "SKU-3003", itemName: "Chenille — Charcoal", yards: 5000 },
      { sku: "SKU-2103", itemName: "Vinyl — Onyx", yards: 4000 },
      { sku: "SKU-4001", itemName: "Velvet — Burgundy", yards: 3000 },
    ],
  },
];

// Orders — exact data from the spec.
export const ORDERS: Order[] = [
  { id: "1042", customerId: "maximus", sku: "SKU-2103", qty: 6000, orderDate: "2026-04-10", promisedEta: "2026-05-12" },
  { id: "1042", customerId: "maximus", sku: "SKU-3002", qty: 1200, orderDate: "2026-04-10", promisedEta: "2026-05-25" },
  { id: "1042", customerId: "maximus", sku: "SKU-4002", qty: 1500, orderDate: "2026-04-10", promisedEta: "2026-06-03" },
  { id: "1042", customerId: "maximus", sku: "SKU-5001", qty: 2000, orderDate: "2026-04-10", promisedEta: "2026-05-25" },
  { id: "1043", customerId: "hartwell", sku: "SKU-2103", qty: 1500, orderDate: "2026-04-12", promisedEta: "2026-05-12" },
  { id: "1043", customerId: "hartwell", sku: "SKU-3001", qty: 800, orderDate: "2026-04-12", promisedEta: "2026-05-12" },
  { id: "1044", customerId: "brookhaven", sku: "SKU-2103", qty: 1200, orderDate: "2026-04-15", promisedEta: "2026-05-12" },
  { id: "1044", customerId: "brookhaven", sku: "SKU-3002", qty: 600, orderDate: "2026-04-15", promisedEta: "2026-05-25" },
  { id: "1045", customerId: "coronado", sku: "SKU-2105", qty: 3500, orderDate: "2026-04-18", promisedEta: "2026-06-10" },
  { id: "1045", customerId: "coronado", sku: "SKU-4001", qty: 1500, orderDate: "2026-04-18", promisedEta: "2026-05-12" },
  { id: "1045", customerId: "coronado", sku: "SKU-6001", qty: 1200, orderDate: "2026-04-18", promisedEta: "2026-06-10" },
  { id: "1046", customerId: "eastlake", sku: "SKU-2104", qty: 4000, orderDate: "2026-04-20", promisedEta: "2026-06-03" },
  { id: "1046", customerId: "eastlake", sku: "SKU-5002", qty: 1800, orderDate: "2026-04-20", promisedEta: "2026-06-10" },
  { id: "1047", customerId: "hartwell", sku: "SKU-2104", qty: 2500, orderDate: "2026-04-22", promisedEta: "2026-06-03" },
  { id: "1047", customerId: "hartwell", sku: "SKU-3003", qty: 1000, orderDate: "2026-04-22", promisedEta: "2026-06-17" },
  { id: "1048", customerId: "brookhaven", sku: "SKU-4002", qty: 1500, orderDate: "2026-04-25", promisedEta: "2026-06-03" },
  { id: "1049", customerId: "romero", sku: "SKU-2103", qty: 50, orderDate: "2026-04-28", promisedEta: "2026-05-12" },
  { id: "1050", customerId: "fabricbook", sku: "SKU-3001", qty: 200, orderDate: "2026-04-29", promisedEta: "2026-05-14" },
  { id: "1051", customerId: "romero", sku: "SKU-2104", qty: 100, orderDate: "2026-04-30", promisedEta: "2026-06-03" },
  { id: "1052", customerId: "fabricbook", sku: "SKU-3002", qty: 300, orderDate: "2026-04-30", promisedEta: "2026-05-25" },
];

export const SHIPPING_FEE_USD = 285; // surfaced when a split is proposed

export function customerById(id: string): Customer {
  const c = CUSTOMERS.find((c) => c.id === id);
  if (!c) throw new Error(`Unknown customer: ${id}`);
  return c;
}

export function tierLabel(tier: Tier): string {
  if (tier === "top-8") return "Top priority";
  if (tier === "key") return "Key account";
  return "Rep-handled";
}

export function tierRank(tier: Tier): number {
  if (tier === "top-8") return 0;
  if (tier === "key") return 1;
  return 2;
}
