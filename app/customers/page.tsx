import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { CUSTOMERS, ORDERS, tierLabel } from "@/lib/data";
import { getAllocation } from "@/lib/allocation";
import { tierRank } from "@/lib/data";
import clsx from "clsx";

export default function CustomersPage() {
  const { orderStates } = getAllocation();

  const rows = CUSTOMERS.map((c) => {
    const orders = ORDERS.filter((o) => o.customerId === c.id);
    const states = orderStates.filter((os) => os.order.customerId === c.id);
    const shortfalls = states.filter((s) => s.isShortfall).length;
    return {
      customer: c,
      orderCount: orders.length,
      shortfalls,
    };
  }).sort((a, b) => {
    const tr = tierRank(a.customer.tier) - tierRank(b.customer.tier);
    if (tr !== 0) return tr;
    return a.customer.name.localeCompare(b.customer.name);
  });

  return (
    <div>
      <PageHeader title="Customers" subtitle="Open orders and conversation history" />

      <div className="rounded-md border border-edge bg-surface">
        <div className="grid grid-cols-12 gap-4 border-b border-edge px-5 py-2.5 text-[11px] uppercase tracking-micro text-ink-faint">
          <div className="col-span-5">Customer</div>
          <div className="col-span-3">Tier</div>
          <div className="col-span-2 text-right tabular-nums">Open orders</div>
          <div className="col-span-2 text-right tabular-nums">Shortfalls</div>
        </div>
        <ul className="divide-y divide-edge">
          {rows.map(({ customer, orderCount, shortfalls }) => (
            <li key={customer.id}>
              <Link
                href={`/customers/${customer.id}`}
                className="grid grid-cols-12 items-baseline gap-4 px-5 py-3.5 transition-colors hover:bg-surface-subtle"
              >
                <div className="col-span-5 text-[13px] font-medium text-ink">
                  {customer.name}
                </div>
                <div className="col-span-3 text-[12px] text-ink-mute">
                  {tierLabel(customer.tier)}
                </div>
                <div className="col-span-2 text-right tabular-nums text-[13px] text-ink-soft">
                  {orderCount}
                </div>
                <div
                  className={clsx(
                    "col-span-2 text-right tabular-nums text-[13px]",
                    shortfalls > 0 ? "text-warn" : "text-ink-faint",
                  )}
                >
                  {shortfalls > 0 ? shortfalls : "—"}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
