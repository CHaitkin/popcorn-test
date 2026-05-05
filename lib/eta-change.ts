// Helpers for the ETA-change cascade (Flow B).
//
// The design's POV: only customers whose *promised* ETA would now be missed
// receive a draft. Customers whose orders are still on time after the shift
// see no email — and that filtering is shown explicitly in the UI.

import { CONTAINERS, ORDERS, customerById } from "./data";
import { getAllocation } from "./allocation";

export type EtaChangeRow = {
  orderId: string;
  customerId: string;
  customerName: string;
  sku: string;
  qty: number;
  oldArrival: string; // container's originalEta
  newArrival: string; // container's current eta
  promisedEta: string;
  affected: boolean; // newArrival > promisedEta && oldArrival <= promisedEta
};

export type EtaChangeView = {
  containerId: string;
  fromEta: string;
  toEta: string;
  rows: EtaChangeRow[];
  affectedCount: number;
  unaffectedCount: number;
};

export function findEtaChange(containerId: string): EtaChangeView | null {
  const c = CONTAINERS.find((c) => c.id === containerId);
  if (!c || !c.originalEta || c.originalEta === c.eta) return null;

  const { allocations } = getAllocation();
  const rows: EtaChangeRow[] = [];
  for (const a of allocations) {
    if (a.containerId !== containerId) continue;
    const order = ORDERS.find(
      (o) => o.id === a.orderId && o.customerId === a.customerId && o.sku === a.sku,
    );
    if (!order) continue;
    const cust = customerById(order.customerId);
    const oldArrival = c.originalEta;
    const newArrival = c.eta;
    const wasOnTime = oldArrival <= order.promisedEta;
    const nowLate = newArrival > order.promisedEta;
    rows.push({
      orderId: order.id,
      customerId: order.customerId,
      customerName: cust.name,
      sku: order.sku,
      qty: a.yards,
      oldArrival,
      newArrival,
      promisedEta: order.promisedEta,
      affected: wasOnTime && nowLate,
    });
  }

  // Group by orderId so a customer with multiple SKUs on this container
  // collapses sensibly. Easier: leave per-line for the prototype.

  rows.sort((a, b) => {
    if (a.affected !== b.affected) return a.affected ? -1 : 1;
    return a.customerName.localeCompare(b.customerName);
  });

  return {
    containerId,
    fromEta: c.originalEta,
    toEta: c.eta,
    rows,
    affectedCount: rows.filter((r) => r.affected).length,
    unaffectedCount: rows.filter((r) => !r.affected).length,
  };
}

export function draftEtaShiftEmail(row: EtaChangeRow, containerId: string): {
  subject: string;
  body: string;
} {
  const subject = `${row.sku} — order #${row.orderId} ETA update`;
  const days = daysBetween(row.promisedEta, row.newArrival);
  const body = [
    `Hi ${row.customerName.split(" ")[0]},`,
    "",
    `An update on order #${row.orderId} (${row.qty.toLocaleString()} yd of ${row.sku}). Container ${containerId}, which carries your yardage, is arriving ${fmt(row.newArrival)} instead of the original ${fmt(row.oldArrival)} — ${days} day${days === 1 ? "" : "s"} after the ${fmt(row.promisedEta)} I promised you.`,
    "",
    `I'm sorry for the slip. Let me know if the new date works or if we need to talk about alternatives.`,
    "",
    `Thanks,`,
    `Janet`,
  ].join("\n");
  return { subject, body };
}

function daysBetween(from: string, to: string): number {
  const a = new Date(from + "T00:00:00Z").getTime();
  const b = new Date(to + "T00:00:00Z").getTime();
  return Math.round((b - a) / 86400000);
}

function fmt(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
}
