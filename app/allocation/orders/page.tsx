"use client";

import Link from "next/link";
import clsx from "clsx";
import { PageHeader } from "@/components/page-header";
import { AllocationTabs } from "@/components/allocation-tabs";
import { getAllocation } from "@/lib/allocation";
import { CONTAINERS, SKU_NAMES } from "@/lib/data";
import { fmtDate, fmtYards } from "@/lib/format";

export default function AllocationByOrderPage() {
  const { orderStates } = getAllocation();

  // Sort by promised ETA ascending — earliest deadlines float up.
  const rows = [...orderStates].sort(
    (a, b) =>
      a.order.promisedEta.localeCompare(b.order.promisedEta) ||
      a.customerName.localeCompare(b.customerName),
  );

  return (
    <div>
      <PageHeader title="Allocation" subtitle="Orders and where their yardage is sourced" />
      <AllocationTabs />

      <div className="rounded-md border border-edge bg-surface">
        <div className="grid grid-cols-12 gap-3 border-b border-edge px-5 py-2.5 text-2xs uppercase tracking-micro text-ink-faint">
          <div className="col-span-1">Order</div>
          <div className="col-span-3">Customer</div>
          <div className="col-span-2">SKU</div>
          <div className="col-span-1 text-right tabular-nums">Qty</div>
          <div className="col-span-1">Promised</div>
          <div className="col-span-3">Sourcing from</div>
          <div className="col-span-1 text-right">Status</div>
        </div>
        <ul className="divide-y divide-edge">
          {rows.map((os) => {
            const sources = os.allocations
              .map((a) => {
                const c = CONTAINERS.find((c) => c.id === a.containerId)!;
                return { id: a.containerId, eta: c.eta, yards: a.yards, late: a.late };
              })
              .sort((a, b) => a.eta.localeCompare(b.eta));

            return (
              <li
                key={`${os.order.id}-${os.order.customerId}-${os.order.sku}`}
                className="grid grid-cols-12 items-baseline gap-3 px-5 py-3 text-[13px]"
              >
                <div className="col-span-1 flex items-baseline gap-1.5 tabular-nums text-ink-mute">
                  {os.isShortfall && (
                    <span
                      aria-label="Shortfall"
                      title="Shortfall"
                      className="inline-block h-1.5 w-1.5 shrink-0 translate-y-[-1px] rounded-full bg-warn"
                    />
                  )}
                  <Link
                    href={`/allocation?order=${os.order.id}`}
                    className="text-ink hover:text-accent"
                  >
                    #{os.order.id}
                  </Link>
                </div>
                <div className="col-span-3 truncate">
                  <Link
                    href={`/customers/${os.order.customerId}`}
                    className="text-ink hover:text-accent"
                  >
                    {os.customerName}
                  </Link>
                </div>
                <div className="col-span-2">
                  <div className="text-ink">{os.order.sku}</div>
                  <div className="text-[11px] text-ink-mute">
                    {SKU_NAMES[os.order.sku]}
                  </div>
                </div>
                <div className="col-span-1 text-right tabular-nums text-ink">
                  {fmtYards(os.order.qty)}
                </div>
                <div className="col-span-1 text-ink-soft">
                  {fmtDate(os.order.promisedEta)}
                </div>
                <div className="col-span-3">
                  {sources.length === 0 ? (
                    <span className="text-[12px] text-ink-faint">Unallocated</span>
                  ) : (
                    <ul className="space-y-0.5 text-[12px]">
                      {sources.map((s) => (
                        <li
                          key={s.id}
                          className={clsx(
                            "flex items-baseline justify-between gap-3",
                            s.late ? "text-warn" : "text-ink-mute",
                          )}
                        >
                          <span>
                            <Link
                              href={`/allocation?customer=${os.order.customerId}&order=${os.order.id}`}
                              className="hover:underline"
                            >
                              {s.id}
                            </Link>
                            <span className="ml-1 text-ink-faint">
                              ({fmtDate(s.eta)})
                            </span>
                          </span>
                          <span className="tabular-nums">
                            {fmtYards(s.yards)}
                            {s.late && (
                              <span className="ml-1 text-2xs uppercase tracking-micro">
                                late
                              </span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div
                  className={clsx(
                    "col-span-1 text-right text-[12px]",
                    os.isShortfall ? "text-warn" : "text-ink-mute",
                  )}
                >
                  {os.isShortfall
                    ? `${fmtYards(os.shortfall)} short`
                    : sources.some((s) => s.late)
                      ? "Late"
                      : "On time"}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
