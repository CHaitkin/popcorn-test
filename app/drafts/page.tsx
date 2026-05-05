"use client";

import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/page-header";

export default function DraftsPage() {
  const drafts = useStore((s) => s.drafts);
  return (
    <div>
      <PageHeader title="Drafts" subtitle="Pending your approval" />
      {drafts.length === 0 ? (
        <div className="mt-12 text-center text-[14px] text-ink-mute">
          No drafts pending.
        </div>
      ) : (
        <ul className="divide-y divide-edge rounded-md border border-edge bg-surface">
          {drafts.map((d) => (
            <li key={d.id} className="px-4 py-3 text-[13px]">
              <div className="flex items-baseline justify-between">
                <span className="font-medium text-ink">{d.customerName}</span>
                <span className="text-[11px] uppercase tracking-micro text-ink-faint">
                  {d.kind.replace("-", " ")}
                </span>
              </div>
              <div className="mt-0.5 text-ink-mute">{d.subject}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
