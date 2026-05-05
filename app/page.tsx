"use client";

import { useStore } from "@/lib/store";
import { deriveInbox } from "@/lib/inbox";
import { InboxItemView } from "@/components/inbox/items";
import { PageHeader } from "@/components/page-header";
import { CONTAINERS, TODAY } from "@/lib/data";
import { fmtDate } from "@/lib/format";

export default function InboxPage() {
  const resolvedShortfalls = useStore((s) => s.resolvedShortfalls);
  const resolvedEtaChanges = useStore((s) => s.resolvedEtaChanges);
  const digestSent = useStore((s) => s.digestSent);

  const items = deriveInbox({
    resolvedShortfalls,
    resolvedEtaChanges,
    digestSent,
  });

  // For empty-state copy: next container ETA after today.
  const upcoming = CONTAINERS
    .map((c) => c.eta)
    .filter((eta) => eta >= TODAY)
    .sort()[0];

  if (items.length === 0) {
    return (
      <div>
        <PageHeader title="Inbox" subtitle="Needs your judgment" showToday />
        <div className="mt-16 text-center text-[14px] text-ink-mute">
          All caught up.
          {upcoming && (
            <span className="ml-1 text-ink-faint">
              Next container ETA: {fmtDate(upcoming)}.
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Inbox" subtitle="Needs your judgment" showToday />
      <div className="space-y-2">
        {items.map((item) => (
          <InboxItemView key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
