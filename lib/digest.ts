// Helpers for the weekly digest (Flow C).
//
// One pre-drafted email per customer with active orders, summarizing each
// order's current ETA based on the latest allocation. Janet reviews/edits and
// approves the batch.

import { CONTAINERS, CUSTOMERS, ORDERS, customerById } from "./data";
import { getAllocation } from "./allocation";

export type DigestRow = {
  customerId: string;
  customerName: string;
  subject: string;
  body: string;
  orderCount: number;
};

export function buildWeeklyDigest(): DigestRow[] {
  const { orderStates } = getAllocation();
  const customerIds = Array.from(new Set(ORDERS.map((o) => o.customerId)));

  return customerIds
    .map((cid) => {
      const cust = customerById(cid);
      const myStates = orderStates.filter(
        (os) => os.order.customerId === cid,
      );
      if (myStates.length === 0) return null;

      const lines = myStates.map((os) => {
        // Latest container the order is allocated from
        const lastAlloc = os.allocations
          .map((a) => ({
            ...a,
            eta: CONTAINERS.find((c) => c.id === a.containerId)!.eta,
          }))
          .sort((a, b) => a.eta.localeCompare(b.eta))
          .at(-1);
        if (!lastAlloc) {
          return `  · Order #${os.order.id} — ${os.order.qty.toLocaleString()} yd ${os.order.sku}: no inbound allocation yet.`;
        }
        const arrivalLabel = fmt(lastAlloc.eta);
        const promiseLabel = fmt(os.order.promisedEta);
        const status = os.isShortfall
          ? `${os.shortfall.toLocaleString()} yd short of promise — I'll be in touch.`
          : lastAlloc.eta > os.order.promisedEta
            ? `arriving ${arrivalLabel} (was ${promiseLabel}).`
            : `on track for ${promiseLabel}.`;
        return `  · Order #${os.order.id} — ${os.order.qty.toLocaleString()} yd ${os.order.sku}: ${status}`;
      });

      const subject = `Weekly ETA update — ${fmtToday()}`;
      const body = [
        `Hi ${cust.name.split(" ")[0]},`,
        "",
        `Quick rundown on your open orders:`,
        "",
        ...lines,
        "",
        `Anything you need to adjust, just reply.`,
        "",
        `Thanks,`,
        `Janet`,
      ].join("\n");

      return {
        customerId: cid,
        customerName: cust.name,
        subject,
        body,
        orderCount: myStates.length,
      };
    })
    .filter((x): x is DigestRow => !!x)
    .sort((a, b) => a.customerName.localeCompare(b.customerName));
}

function fmt(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function fmtToday(): string {
  return fmt("2026-05-05");
}

void CUSTOMERS;
