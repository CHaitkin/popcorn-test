"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useMemo } from "react";
import clsx from "clsx";
import { PageHeader } from "@/components/page-header";
import { AllocationTabs } from "@/components/allocation-tabs";
import { RecentChanges } from "@/components/recent-changes";
import { getAllocation } from "@/lib/allocation";
import { CUSTOMERS, ORDERS, customerById } from "@/lib/data";
import { fmtDate, fmtYards } from "@/lib/format";

export default function AllocationByContainerPage() {
  return (
    <Suspense fallback={null}>
      <PageContent />
    </Suspense>
  );
}

function PageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const customerFilter = params.get("customer") ?? "";
  const orderFilter = params.get("order") ?? "";

  const { containerStates } = getAllocation();
  const orderIds = useMemo(
    () => Array.from(new Set(ORDERS.map((o) => o.id))).sort(),
    [],
  );

  // Whether the current view should consider an allocation "in scope"
  // given the active filters.
  function matches(customerId: string, orderId: string): boolean {
    if (customerFilter && customerId !== customerFilter) return false;
    if (orderFilter && orderId !== orderFilter) return false;
    return true;
  }

  function setFilter(key: "customer" | "order", value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push("/allocation" + (next.toString() ? `?${next}` : ""));
  }

  function clear() {
    router.push("/allocation");
  }

  const activeFilter = customerFilter || orderFilter;

  return (
    <div>
      <PageHeader title="Allocation" subtitle="Incoming yardage and current allocation" />
      <AllocationTabs />
      <RecentChanges />

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-md border border-edge bg-surface px-4 py-3">
        <FilterSelect
          label="Customer"
          value={customerFilter}
          onChange={(v) => setFilter("customer", v)}
          options={[
            { value: "", label: "All" },
            ...CUSTOMERS.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
        <FilterSelect
          label="Order"
          value={orderFilter}
          onChange={(v) => setFilter("order", v)}
          options={[
            { value: "", label: "All" },
            ...orderIds.map((id) => ({ value: id, label: `#${id}` })),
          ]}
        />
        {activeFilter && (
          <div className="ml-auto flex items-center gap-2">
            {customerFilter && (
              <Chip
                onClear={() => setFilter("customer", "")}
                label={customerById(customerFilter).name}
              />
            )}
            {orderFilter && (
              <Chip
                onClear={() => setFilter("order", "")}
                label={`Order #${orderFilter}`}
              />
            )}
            <button
              onClick={clear}
              className="text-[12px] text-ink-mute hover:text-ink-soft"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Container list */}
      <div className="space-y-7">
        {containerStates.map((cs) => {
          // Per-SKU lines that have at least one allocation matching the
          // filter — or, if no filters, all lines.
          const visibleLines = cs.perSku
            .map((line) => {
              const allocs = activeFilter
                ? line.allocations.filter((a) => matches(a.customerId, a.orderId))
                : line.allocations;
              return { ...line, allocations: allocs };
            })
            .filter((line) => !activeFilter || line.allocations.length > 0);

          if (visibleLines.length === 0) return null;

          const c = cs.container;
          const shifted = c.originalEta && c.originalEta !== c.eta;

          return (
            <section
              key={c.id}
              className="rounded-md border border-edge bg-surface"
            >
              <header className="flex items-baseline justify-between border-b border-edge px-5 py-3">
                <div className="flex items-baseline gap-3">
                  <h2 className="text-[14px] font-semibold tracking-tight text-ink">
                    {c.id}
                  </h2>
                  {cs.hasShortfall && !activeFilter && (
                    <span className="rounded-sm bg-warn-soft px-1.5 py-0.5 text-2xs font-medium uppercase tracking-micro text-warn">
                      Shortfall on this container
                    </span>
                  )}
                </div>
                <div className="text-[12px] text-ink-mute">
                  {shifted ? (
                    <span>
                      <span className="text-ink-faint line-through">
                        {fmtDate(c.originalEta!)}
                      </span>
                      <span className="mx-1.5 text-ink-faint">→</span>
                      <span className="font-medium text-ink-soft">
                        {fmtDate(c.eta)}
                      </span>
                      <span className="ml-2 text-2xs uppercase tracking-micro text-warn">
                        Shifted
                      </span>
                    </span>
                  ) : (
                    <span>ETA {fmtDate(c.eta)}</span>
                  )}
                </div>
              </header>

              <div className="divide-y divide-edge">
                {visibleLines.map((line) => (
                  <SkuRow key={line.sku} line={line} />
                ))}
              </div>
            </section>
          );
        })}

        {/* Empty state when filters exclude everything */}
        {activeFilter &&
          containerStates.every((cs) =>
            cs.perSku.every(
              (line) =>
                !line.allocations.some((a) => matches(a.customerId, a.orderId)),
            ),
          ) && (
            <div className="rounded-md border border-dashed border-edge px-5 py-8 text-center text-[13px] text-ink-mute">
              No allocations match this filter.
            </div>
          )}
      </div>
    </div>
  );
}

function SkuRow({
  line,
}: {
  line: ReturnType<
    typeof getAllocation
  >["containerStates"][number]["perSku"][number];
}) {
  const overallocated = line.yardsAllocated > line.yardsIn;
  return (
    <div className="grid grid-cols-12 gap-4 px-5 py-3.5">
      <div className="col-span-4">
        <div className="text-[13px] font-medium text-ink">{line.sku}</div>
        <div className="text-[12px] text-ink-mute">{line.itemName}</div>
      </div>
      <div className="col-span-2 text-right">
        <div className="tabular-nums text-[13px] text-ink">
          {fmtYards(line.yardsIn)}
        </div>
        <div className="text-2xs uppercase tracking-micro text-ink-faint">in</div>
      </div>
      <div className="col-span-4">
        {line.allocations.length === 0 ? (
          <div className="text-[12px] text-ink-faint">No allocations</div>
        ) : (
          <ul className="space-y-1">
            {line.allocations.map((a, i) => {
              const cust = customerById(a.customerId);
              const isShortfall = a.late;
              return (
                <li
                  key={i}
                  className="flex items-baseline justify-between gap-3 text-[12px]"
                >
                  <span className="flex items-baseline gap-2 truncate text-ink-soft">
                    {isShortfall && (
                      <span
                        aria-label="Shortfall on this row"
                        title="Shortfall on this row"
                        className="inline-block h-1.5 w-1.5 shrink-0 translate-y-[-1px] rounded-full bg-warn"
                      />
                    )}
                    <span className="truncate">{cust.name}</span>
                    <span className="text-ink-faint">#{a.orderId}</span>
                  </span>
                  <span
                    className={clsx(
                      "tabular-nums",
                      isShortfall ? "text-warn" : "text-ink-mute",
                    )}
                  >
                    {fmtYards(a.yards)}
                    {isShortfall && (
                      <span className="ml-1 text-2xs uppercase tracking-micro">
                        late
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="col-span-2 text-right">
        <div
          className={clsx(
            "tabular-nums text-[13px]",
            overallocated ? "text-warn" : "text-ink-soft",
            line.yardsUnallocated === 0 && "text-ink-faint",
          )}
        >
          {fmtYards(line.yardsUnallocated)}
        </div>
        <div className="text-2xs uppercase tracking-micro text-ink-faint">
          unallocated
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-2 text-[12px] text-ink-mute">
      <span className="uppercase tracking-micro">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-edge bg-surface px-2 py-1 text-[13px] text-ink outline-none transition-colors hover:border-edge-strong focus:border-accent"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="flex items-center gap-1.5 rounded-md bg-accent-soft px-2 py-0.5 text-[12px] text-accent">
      <span>{label}</span>
      <button
        onClick={onClear}
        className="text-accent/70 hover:text-accent"
        aria-label="Remove filter"
      >
        ✕
      </button>
    </span>
  );
}
