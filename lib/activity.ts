// Recent edits to the data that informs the Allocation view.
// These are activity-log entries describing *changes* made by the boss in
// Excel — not invented business data. The customer/order data above remains
// the spec dataset; these entries describe edits to it.

export type ActivityEntry = {
  // Format: "May 5, 09:14"
  when: string;
  // ISO timestamp for sorting
  at: string;
  kind: "eta-shift" | "qty-change" | "new-order";
  summary: string;
  detail: string;
};

// Today is 2026-05-05. "Last 24 hours" = May 4 ~07:00 onward.
export const RECENT_ACTIVITY: ActivityEntry[] = [
  {
    when: "May 5, 09:14",
    at: "2026-05-05T09:14:00Z",
    kind: "eta-shift",
    summary: "ETA shift on MAEU-7821: May 8 → May 11",
    detail: "6 orders carry yardage on this container. 0 customer promises breached — no drafts generated.",
  },
  {
    when: "May 5, 08:02",
    at: "2026-05-05T08:02:00Z",
    kind: "qty-change",
    summary: "Order #1044 (Brookhaven, SKU-2103): 1,000 → 1,200 yd",
    detail: "Crossed into shortfall against the May 12 promise — surfaced in Inbox.",
  },
  {
    when: "May 4, 16:30",
    at: "2026-05-04T16:30:00Z",
    kind: "new-order",
    summary: "New order #1052 (FabricBook, SKU-3002): 300 yd",
    detail: "Promised May 25. Allocated from ONEU-5532 — on time.",
  },
];
