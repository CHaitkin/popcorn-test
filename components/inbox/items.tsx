"use client";

import {
  InboxItem,
  ShortfallItem,
  EtaChangeItem,
  AwaitingReplyItem,
  EarlyFillEmptyItem,
  WeeklyDigestItem,
} from "@/lib/inbox";
import { fmtDate, fmtYards, relativeFromToday } from "@/lib/format";
import { SKU_NAMES } from "@/lib/data";
import { InboxCard } from "./card-shell";

export function InboxItemView({ item }: { item: InboxItem }) {
  switch (item.type) {
    case "shortfall":
      return <ShortfallCard item={item} />;
    case "eta-change":
      return <EtaChangeCard item={item} />;
    case "awaiting-reply":
      return <AwaitingReplyCard item={item} />;
    case "early-fill-empty":
      return <EarlyFillEmptyCard item={item} />;
    case "weekly-digest":
      return <WeeklyDigestCard item={item} />;
    case "early-fill":
      // Real early-fill rendering would go here; the prototype data doesn't
      // trigger a natural one. Fall through to empty.
      return <EarlyFillEmptyCard item={{ type: "early-fill-empty", id: item.id }} />;
  }
}

function ShortfallCard({ item }: { item: ShortfallItem }) {
  const os = item.orderState;
  const variant = item.repHandled ? "muted" : "urgent";
  return (
    <InboxCard
      href={`/inbox/shortfall/${encodeURIComponent(item.id)}`}
      variant={variant}
      eyebrow="Shortfall"
      meta={
        item.repHandled
          ? "Rep-handled"
          : os.tier === "top-8"
            ? "Top priority"
            : "Key account"
      }
      action={<Chevron />}
    >
      <div>
        <span className="font-medium">{os.customerName}</span>
        <span className="text-ink-mute"> · </span>
        <span>
          {fmtYards(os.shortfall)} short of {fmtYards(os.order.qty)} {os.order.sku}
        </span>
      </div>
      <div className="mt-1 text-[12px] text-ink-mute">
        Promised {fmtDate(os.order.promisedEta)} ({relativeFromToday(os.order.promisedEta)}).
        Next container with {os.order.sku}: {nextContainerSummary(item)}.
      </div>
    </InboxCard>
  );
}

function nextContainerSummary(item: ShortfallItem): string {
  const futures = item.containerCandidates.filter(
    (c) => c.eta > item.orderState.order.promisedEta && c.available > 0,
  );
  if (futures.length === 0) return "no later supply";
  const f = futures[0];
  return `${f.containerId} (${fmtDate(f.eta)})`;
}

function EtaChangeCard({ item }: { item: EtaChangeItem }) {
  const affectedCount = item.affectedOrders.length;
  const hasImpact = affectedCount > 0;
  return (
    <InboxCard
      href={`/inbox/eta-change/${item.containerId}`}
      variant={hasImpact ? "attention" : "calm"}
      eyebrow="ETA shift"
      meta={item.containerId}
      action={<Chevron />}
    >
      <div>
        <span className="font-medium">{fmtDate(item.fromEta)} → {fmtDate(item.toEta)}</span>
        <span className="text-ink-mute"> · </span>
        {hasImpact ? (
          <span>
            {affectedCount} customer{affectedCount === 1 ? "" : "s"} need notification
          </span>
        ) : (
          <span>No customer promises breached</span>
        )}
      </div>
      <div className="mt-1 text-[12px] text-ink-mute">
        {item.totalOrdersOnContainer} order{item.totalOrdersOnContainer === 1 ? "" : "s"} on this container.{" "}
        {item.unaffectedCount > 0 && (
          <span>{item.unaffectedCount} still on time — no draft generated.</span>
        )}
      </div>
    </InboxCard>
  );
}

function AwaitingReplyCard({ item }: { item: AwaitingReplyItem }) {
  const stale = item.daysStale >= 5;
  return (
    <InboxCard
      href={`/customers/${item.customerId}`}
      variant={stale ? "attention" : "calm"}
      eyebrow="Awaiting reply"
      meta={`${item.daysStale} day${item.daysStale === 1 ? "" : "s"} ago`}
      action={<Chevron />}
    >
      <div>
        <span className="font-medium">{item.customerName}</span>
        <span className="text-ink-mute"> · </span>
        <span>{item.subject}</span>
      </div>
    </InboxCard>
  );
}

function EarlyFillEmptyCard({ item }: { item: EarlyFillEmptyItem }) {
  return (
    <InboxCard variant="empty" eyebrow="Early-fill opportunity">
      <span className="text-ink-mute">
        No opportunities right now. Surplus on a future container will surface
        here when a later-promised order could be moved up.
      </span>
    </InboxCard>
  );
}

function WeeklyDigestCard({ item }: { item: WeeklyDigestItem }) {
  return (
    <InboxCard
      href="/inbox/weekly-digest"
      variant="calm"
      eyebrow="Tuesday digest"
      action={<Chevron />}
    >
      <div>
        <span className="font-medium">{item.customerCount} customers</span>
        <span className="text-ink-mute"> · </span>
        <span>Pre-drafted ETAs ready for review</span>
      </div>
    </InboxCard>
  );
}

function Chevron() {
  return (
    <svg
      className="mt-0.5 h-3.5 w-3.5 text-ink-faint transition-transform group-hover:translate-x-0.5"
      viewBox="0 0 16 16"
      fill="none"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Placeholder for a "tag" used in spec copy
export function _unused() {
  // Suppress unused warning for SKU_NAMES — used elsewhere in app.
  void SKU_NAMES;
}
