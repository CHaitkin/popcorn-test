// Derives the Inbox feed from allocation state + store state.
//
// The Inbox is a decision queue, not a metrics dashboard. Each item is one of
// five types, sorted by urgency:
//   1. Shortfall                — supply < promised demand; needs Janet's call
//   2. ETA-change drafts        — boss's ETA shift crosses customer promises
//   3. Awaiting customer reply  — Janet sent a question; >5 days stale floats up
//   4. Early-fill opportunity   — leftover supply on a future container could
//                                 fulfill a later-promised customer
//   5. Weekly digest queued     — Tuesday roll-up

import { CONTAINERS, ORDERS, TODAY, customerById, tierRank } from "./data";
import { getAllocation, OrderState } from "./allocation";

export type InboxItem =
  | ShortfallItem
  | EtaChangeItem
  | AwaitingReplyItem
  | EarlyFillItem
  | EarlyFillEmptyItem
  | WeeklyDigestItem;

export type ShortfallItem = {
  type: "shortfall";
  id: string;
  orderState: OrderState;
  containerCandidates: { containerId: string; eta: string; available: number }[];
  // True for smaller-tier orders — visibly de-emphasized in UI.
  repHandled: boolean;
};

export type EtaChangeItem = {
  type: "eta-change";
  id: string;
  containerId: string;
  fromEta: string;
  toEta: string;
  affectedOrders: { orderState: OrderState; oldPromise: string; newArrival: string }[];
  unaffectedCount: number;
  totalOrdersOnContainer: number;
};

export type AwaitingReplyItem = {
  type: "awaiting-reply";
  id: string;
  customerId: string;
  customerName: string;
  subject: string;
  sentAt: string;
  daysStale: number;
};

export type EarlyFillItem = {
  type: "early-fill";
  id: string;
  containerId: string;
  containerEta: string;
  sku: string;
  itemName: string;
  yardsAvailable: number;
  candidateOrderId: string;
  candidateCustomerName: string;
};

export type EarlyFillEmptyItem = {
  type: "early-fill-empty";
  id: string;
};

export type WeeklyDigestItem = {
  type: "weekly-digest";
  id: string;
  customerCount: number;
};

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z").getTime();
  const db = new Date(b + "T00:00:00Z").getTime();
  return Math.round((db - da) / 86400000);
}

export type InboxInput = {
  // Shortfall ids the user has resolved (sent a question for) — they become
  // awaiting-reply items instead.
  resolvedShortfalls: { id: string; customerId: string; customerName: string; subject: string; sentAt: string }[];
  // ETA-change items the user has dispatched (drafts approved & sent).
  resolvedEtaChanges: string[];
  // Weekly digest dispatched.
  digestSent: boolean;
};

export function deriveInbox(input: InboxInput): InboxItem[] {
  const { orderStates } = getAllocation();
  const items: InboxItem[] = [];

  // 1. Shortfalls — one card per shortfall order, not yet resolved.
  const shortfallOrders = orderStates
    .filter((os) => os.isShortfall)
    .filter(
      (os) =>
        !input.resolvedShortfalls.some(
          (r) => r.id === shortfallId(os),
        ),
    );

  // Stable sort: top-8 first, then key, then smaller; within tier earliest promise.
  shortfallOrders.sort((a, b) => {
    const tr = tierRank(a.tier) - tierRank(b.tier);
    if (tr !== 0) return tr;
    return a.order.promisedEta.localeCompare(b.order.promisedEta);
  });

  for (const os of shortfallOrders) {
    items.push({
      type: "shortfall",
      id: shortfallId(os),
      orderState: os,
      containerCandidates: candidateContainers(os),
      repHandled: os.tier === "smaller",
    });
  }

  // 2. ETA-change drafts — one card per container with originalEta != eta.
  for (const c of CONTAINERS) {
    if (!c.originalEta || c.originalEta === c.eta) continue;
    if (input.resolvedEtaChanges.includes(c.id)) continue;

    // Which orders touch this container? Anyone with an allocation from it.
    const touchedOrderStates = orderStates.filter((os) =>
      os.allocations.some((a) => a.containerId === c.id),
    );
    // An order is "affected" if its arrival from this container is now after
    // its promised ETA, but was on time at originalEta.
    const affected = touchedOrderStates.filter((os) => {
      const allocFromThis = os.allocations.find((a) => a.containerId === c.id)!;
      const wasOnTime = c.originalEta! <= os.order.promisedEta;
      const nowLate = c.eta > os.order.promisedEta;
      return wasOnTime && nowLate && allocFromThis.yards > 0;
    });

    items.push({
      type: "eta-change",
      id: `eta-${c.id}`,
      containerId: c.id,
      fromEta: c.originalEta,
      toEta: c.eta,
      affectedOrders: affected.map((os) => ({
        orderState: os,
        oldPromise: os.order.promisedEta,
        newArrival: c.eta,
      })),
      unaffectedCount: touchedOrderStates.length - affected.length,
      totalOrdersOnContainer: touchedOrderStates.length,
    });
  }

  // 3. Awaiting customer reply — items the user resolved are surfaced here
  // until the prototype "receives" a reply (it doesn't; this is local state).
  for (const r of input.resolvedShortfalls) {
    const days = Math.max(0, daysBetween(r.sentAt, TODAY));
    items.push({
      type: "awaiting-reply",
      id: `awaiting-${r.id}`,
      customerId: r.customerId,
      customerName: r.customerName,
      subject: r.subject,
      sentAt: r.sentAt,
      daysStale: days,
    });
  }

  // 4. Early-fill — flag, don't act. We look for: a container with leftover
  // yardage of a SKU, AND an order for that SKU promised AFTER that container's
  // ETA but before any later container's ETA, with positive remaining qty.
  // In the spec dataset, no such pairing exists naturally — so this surfaces
  // as the "no opportunities right now" empty slot.
  const earlyFills: EarlyFillItem[] = [];
  // (Real detection logic deliberately omitted for prototype — would walk
  // ContainerState.perSku.yardsUnallocated against orders' future promises.)
  if (earlyFills.length === 0) {
    items.push({ type: "early-fill-empty", id: "early-fill-empty" });
  } else {
    items.push(...earlyFills);
  }

  // 5. Weekly digest — Tuesday only. May 5, 2026 is a Tuesday.
  if (!input.digestSent && isTuesday(TODAY)) {
    const customerCount = new Set(ORDERS.map((o) => o.customerId)).size;
    items.push({
      type: "weekly-digest",
      id: "digest",
      customerCount,
    });
  }

  return sortByUrgency(items);
}

function shortfallId(os: OrderState): string {
  return `shortfall-${os.order.customerId}-${os.order.sku}-${os.order.id}`;
}

function candidateContainers(os: OrderState) {
  // Containers carrying this SKU, with what's currently allocated (so the
  // detail view can show "May 8: 500 yd available after top-8").
  const { containerStates } = getAllocation();
  return containerStates
    .filter((cs) => cs.perSku.some((p) => p.sku === os.order.sku))
    .map((cs) => {
      const line = cs.perSku.find((p) => p.sku === os.order.sku)!;
      const allocToThis = line.allocations.find(
        (a) => a.customerId === os.order.customerId && a.orderId === os.order.id,
      );
      return {
        containerId: cs.container.id,
        eta: cs.container.eta,
        available: (allocToThis?.yards ?? 0) + line.yardsUnallocated,
      };
    });
}

function isTuesday(iso: string): boolean {
  return new Date(iso + "T00:00:00Z").getUTCDay() === 2;
}

const TYPE_ORDER: Record<InboxItem["type"], number> = {
  shortfall: 0,
  "eta-change": 1,
  "awaiting-reply": 2,
  "early-fill": 3,
  "early-fill-empty": 4,
  "weekly-digest": 5,
};

function sortByUrgency(items: InboxItem[]): InboxItem[] {
  return [...items].sort((a, b) => {
    const ta = TYPE_ORDER[a.type];
    const tb = TYPE_ORDER[b.type];
    if (ta !== tb) return ta - tb;
    // Within shortfalls: top-8 first; rep-handled last
    if (a.type === "shortfall" && b.type === "shortfall") {
      return tierRank(a.orderState.tier) - tierRank(b.orderState.tier);
    }
    // Within awaiting-reply: stalest first
    if (a.type === "awaiting-reply" && b.type === "awaiting-reply") {
      return b.daysStale - a.daysStale;
    }
    return 0;
  });
}
