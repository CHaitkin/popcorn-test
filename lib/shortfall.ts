// Helpers for the shortfall decision (Flow A).
//
// Given a shortfall order, surface the two real options Janet has:
//   1. SPLIT — take what's available on the early container now, the rest from
//      the next-arriving container that has supply. Two shipments, extra fee.
//   2. HOLD — wait for a single later container that can fulfill the whole order
//      in one shipment. No extra fee, but more days late.

import { CONTAINERS, ORDERS, SHIPPING_FEE_USD } from "./data";
import { getAllocation, OrderState } from "./allocation";

export type SplitOption = {
  kind: "split";
  earlyContainerId: string;
  earlyEta: string;
  earlyYards: number;
  earlyDeltaDays: number; // negative = early, positive = late
  laterContainerId: string;
  laterEta: string;
  laterYards: number;
  laterDeltaDays: number;
  shippingFeeUsd: number;
};

export type HoldOption = {
  kind: "hold";
  containerId: string;
  eta: string;
  yards: number;
  deltaDays: number;
};

export type ShortfallDecision = {
  orderState: OrderState;
  // What's currently allocated (on time partial)
  earlyAllocYards: number;
  earlyContainerId: string | null;
  earlyEta: string | null;
  // The later container that can complete the rest
  catchupContainerId: string;
  catchupEta: string;
  // Options
  split: SplitOption | null;
  hold: HoldOption;
};

function daysBetween(from: string, to: string): number {
  const a = new Date(from + "T00:00:00Z").getTime();
  const b = new Date(to + "T00:00:00Z").getTime();
  return Math.round((b - a) / 86400000);
}

export function findShortfallById(shortfallId: string): ShortfallDecision | null {
  // shortfallId format: shortfall-{customerId}-{sku}-{orderId}
  // Find the matching order state.
  const { orderStates } = getAllocation();
  const os = orderStates.find(
    (o) =>
      o.isShortfall &&
      `shortfall-${o.order.customerId}-${o.order.sku}-${o.order.id}` ===
        shortfallId,
  );
  if (!os) return null;

  // Locate this customer's existing partial allocation (if any) on the early
  // container — i.e. allocations whose container ETA <= their promised ETA.
  const earlyAllocs = os.allocations.filter((a) => {
    const c = CONTAINERS.find((c) => c.id === a.containerId)!;
    return c.eta <= os.order.promisedEta;
  });
  const earlyContainerId = earlyAllocs[0]?.containerId ?? null;
  const earlyEta = earlyContainerId
    ? CONTAINERS.find((c) => c.id === earlyContainerId)!.eta
    : null;
  const earlyAllocYards = earlyAllocs.reduce((s, a) => s + a.yards, 0);

  // Find the next container with supply for this SKU after the customer's
  // promised ETA — that's where the rest comes from in either option.
  const lateAllocs = os.allocations.filter((a) => {
    const c = CONTAINERS.find((c) => c.id === a.containerId)!;
    return c.eta > os.order.promisedEta;
  });
  const catchupContainerId = lateAllocs[0]?.containerId;
  const catchupEta = catchupContainerId
    ? CONTAINERS.find((c) => c.id === catchupContainerId)!.eta
    : null;

  if (!catchupContainerId || !catchupEta) {
    // Should not happen with the spec dataset.
    return null;
  }

  const laterYardsNeeded = os.order.qty - earlyAllocYards;

  // Split option only exists if there's an early-container partial available.
  const split: SplitOption | null =
    earlyAllocYards > 0 && earlyContainerId && earlyEta
      ? {
          kind: "split",
          earlyContainerId,
          earlyEta,
          earlyYards: earlyAllocYards,
          earlyDeltaDays: daysBetween(os.order.promisedEta, earlyEta),
          laterContainerId: catchupContainerId,
          laterEta: catchupEta,
          laterYards: laterYardsNeeded,
          laterDeltaDays: daysBetween(os.order.promisedEta, catchupEta),
          shippingFeeUsd: SHIPPING_FEE_USD,
        }
      : null;

  const hold: HoldOption = {
    kind: "hold",
    containerId: catchupContainerId,
    eta: catchupEta,
    yards: os.order.qty,
    deltaDays: daysBetween(os.order.promisedEta, catchupEta),
  };

  return {
    orderState: os,
    earlyAllocYards,
    earlyContainerId,
    earlyEta,
    catchupContainerId,
    catchupEta,
    split,
    hold,
  };
}

export function draftSplitEmail(d: ShortfallDecision): {
  subject: string;
  body: string;
} {
  const os = d.orderState;
  const split = d.split!;
  const subject = `${os.order.sku} — split shipment proposal for order #${os.order.id}`;
  const body = [
    `Hi ${os.customerName.split(" ")[0]},`,
    "",
    `Quick note on order #${os.order.id} for ${os.order.qty.toLocaleString()} yd of ${os.order.sku}, promised ${fmt(os.order.promisedEta)}.`,
    "",
    `Our incoming container ${split.earlyContainerId} (arriving ${fmt(split.earlyEta)}) has ${split.earlyYards.toLocaleString()} yd available against your order. The remaining ${split.laterYards.toLocaleString()} yd would arrive on ${split.laterContainerId} (${fmt(split.laterEta)}).`,
    "",
    `Two ways forward:`,
    `  · Split shipment — ${split.earlyYards.toLocaleString()} yd by ${fmt(split.earlyEta)} (${signed(split.earlyDeltaDays)} vs. promise) and ${split.laterYards.toLocaleString()} yd by ${fmt(split.laterEta)} (${signed(split.laterDeltaDays)}). Adds a $${split.shippingFeeUsd} second-shipment fee.`,
    `  · Hold for full — entire ${os.order.qty.toLocaleString()} yd in one shipment on ${fmt(d.hold.eta)} (${signed(d.hold.deltaDays)}). No extra fee.`,
    "",
    `Want me to proceed with the split, or hold for the full shipment? Either way I'll lock it in once you confirm.`,
    "",
    `Thanks,`,
    `Janet`,
  ].join("\n");
  return { subject, body };
}

export function draftHoldEmail(d: ShortfallDecision): {
  subject: string;
  body: string;
} {
  const os = d.orderState;
  const subject = `${os.order.sku} — order #${os.order.id} timing update`;
  const body = [
    `Hi ${os.customerName.split(" ")[0]},`,
    "",
    `Heads up that order #${os.order.id} (${os.order.qty.toLocaleString()} yd of ${os.order.sku}) won't make the ${fmt(os.order.promisedEta)} promise — our supply on that date is short by ${d.orderState.shortfall.toLocaleString()} yd.`,
    "",
    `I'd like to hold the full order and ship together on ${fmt(d.hold.eta)} (${signed(d.hold.deltaDays)} vs. original promise). One shipment, no extra fees.`,
    "",
    `Let me know if that works. Happy to discuss alternatives if you need the partial sooner.`,
    "",
    `Thanks,`,
    `Janet`,
  ].join("\n");
  return { subject, body };
}

function fmt(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function signed(n: number): string {
  if (n === 0) return "on time";
  if (n > 0) return `${n} day${n === 1 ? "" : "s"} late`;
  return `${-n} day${-n === 1 ? "" : "s"} early`;
}

void ORDERS;
