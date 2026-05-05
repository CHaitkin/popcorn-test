"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import {
  CUSTOMERS,
  CONTAINERS,
  SKU_NAMES,
  customerById,
  tierLabel,
} from "@/lib/data";
import { getAllocation } from "@/lib/allocation";
import { fmtDate, fmtYards, relativeFromToday } from "@/lib/format";
import { useStore } from "@/lib/store";
import clsx from "clsx";

export default function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  if (!CUSTOMERS.find((c) => c.id === params.id)) notFound();
  const customer = customerById(params.id);
  const { orderStates } = getAllocation();
  const myOrders = orderStates.filter((os) => os.order.customerId === params.id);

  const sentMessages = useStore((s) =>
    s.sent.filter((m) => m.customerId === params.id),
  );
  const awaitingReply = useStore((s) =>
    s.resolvedShortfalls.filter((r) => r.customerId === params.id),
  );

  return (
    <div>
      <div className="mb-2">
        <Link
          href="/customers"
          className="text-[12px] text-ink-mute hover:text-ink-soft"
        >
          ← Customers
        </Link>
      </div>
      <PageHeader title={customer.name} subtitle={tierLabel(customer.tier)} />

      <section className="mb-9">
        <h2 className="mb-3 text-[11px] font-medium uppercase tracking-micro text-ink-mute">
          Open orders
        </h2>
        <div className="rounded-md border border-edge bg-surface">
          <div className="grid grid-cols-12 gap-3 border-b border-edge px-5 py-2.5 text-[11px] uppercase tracking-micro text-ink-faint">
            <div className="col-span-2">Order</div>
            <div className="col-span-4">SKU</div>
            <div className="col-span-2 text-right tabular-nums">Qty</div>
            <div className="col-span-2">Promised</div>
            <div className="col-span-2 text-right">Status</div>
          </div>
          <ul className="divide-y divide-edge">
            {myOrders.map((os) => (
              <OrderRow key={`${os.order.id}-${os.order.sku}`} os={os} />
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-[11px] font-medium uppercase tracking-micro text-ink-mute">
          Conversation
        </h2>
        {awaitingReply.length === 0 && sentMessages.length === 0 ? (
          <div className="rounded-md border border-dashed border-edge bg-transparent px-5 py-6 text-center text-[13px] text-ink-mute">
            No recent correspondence.
          </div>
        ) : (
          <ul className="space-y-2">
            {awaitingReply.map((r) => (
              <li
                key={r.id}
                className="rounded-md border border-edge-strong bg-surface px-5 py-3"
              >
                <div className="flex items-baseline justify-between text-[11px] uppercase tracking-micro text-ink-mute">
                  <span>Awaiting reply</span>
                  <span className="text-ink-faint">
                    Sent {relativeFromToday(r.sentAt)}
                  </span>
                </div>
                <div className="mt-1 text-[14px] text-ink">{r.subject}</div>
              </li>
            ))}
            {sentMessages
              .filter((m) => !awaitingReply.some((a) => a.subject === m.subject))
              .map((m) => (
                <li
                  key={m.id}
                  className="rounded-md border border-edge bg-surface px-5 py-3"
                >
                  <div className="flex items-baseline justify-between text-[11px] uppercase tracking-micro text-ink-mute">
                    <span>{m.kind.replace("-", " ")}</span>
                    <span className="text-ink-faint">
                      Sent {relativeFromToday(m.sentAt)}
                    </span>
                  </div>
                  <div className="mt-1 text-[14px] text-ink">{m.subject}</div>
                </li>
              ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function OrderRow({
  os,
}: {
  os: ReturnType<typeof getAllocation>["orderStates"][number];
}) {
  const arrivals = os.allocations
    .map((a) => CONTAINERS.find((c) => c.id === a.containerId)!.eta)
    .sort();
  const lastArrival = arrivals.length ? arrivals[arrivals.length - 1] : null;

  return (
    <li className="grid grid-cols-12 items-baseline gap-3 px-5 py-3 text-[13px]">
      <div className="col-span-2 text-ink-mute tabular-nums">#{os.order.id}</div>
      <div className="col-span-4">
        <div className="text-ink">{os.order.sku}</div>
        <div className="text-[12px] text-ink-mute">
          {SKU_NAMES[os.order.sku]}
        </div>
      </div>
      <div className="col-span-2 text-right tabular-nums text-ink">
        {fmtYards(os.order.qty)}
      </div>
      <div className="col-span-2 text-ink-soft">
        {fmtDate(os.order.promisedEta)}
      </div>
      <div
        className={clsx(
          "col-span-2 text-right text-[12px]",
          os.isShortfall ? "text-warn" : "text-ink-mute",
        )}
      >
        {os.isShortfall ? (
          <span>
            {fmtYards(os.shortfall)} short
          </span>
        ) : lastArrival && lastArrival > os.order.promisedEta ? (
          <span>Arrives {fmtDate(lastArrival)}</span>
        ) : (
          <span>Allocated</span>
        )}
      </div>
    </li>
  );
}
