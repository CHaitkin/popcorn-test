"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/page-header";

const KIND_LABEL: Record<string, string> = {
  "shortfall-question": "Shortfall question",
  "eta-change": "ETA change",
  "weekly-digest": "Weekly digest",
};

export default function DraftsPage() {
  const drafts = useStore((s) => s.drafts);
  const updateDraftBody = useStore((s) => s.updateDraftBody);
  const removeDraft = useStore((s) => s.removeDraft);
  const sendDraft = useStore((s) => s.sendDraft);

  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div>
      <PageHeader title="Drafts" subtitle="Pending your approval" />

      {drafts.length === 0 ? (
        <div className="mt-12 text-center text-[14px] text-ink-mute">
          No drafts pending.
        </div>
      ) : (
        <ul className="space-y-2">
          {drafts.map((d) => (
            <li
              key={d.id}
              className="rounded-md border border-edge bg-surface"
            >
              <button
                onClick={() => setOpenId(openId === d.id ? null : d.id)}
                className="flex w-full items-baseline justify-between px-5 py-3 text-left transition-colors hover:bg-surface-subtle"
              >
                <div>
                  <div className="text-[13px] font-medium text-ink">
                    {d.customerName}
                  </div>
                  <div className="text-[12px] text-ink-mute">{d.subject}</div>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-[11px] uppercase tracking-micro text-ink-faint">
                    {KIND_LABEL[d.kind] ?? d.kind}
                  </span>
                  <span className="text-[12px] text-ink-mute">
                    {openId === d.id ? "Hide" : "Open"}
                  </span>
                </div>
              </button>
              {openId === d.id && (
                <div>
                  <textarea
                    value={d.body}
                    onChange={(e) => updateDraftBody(d.id, e.target.value)}
                    rows={10}
                    className="block w-full resize-y border-t border-edge bg-transparent px-5 py-3 font-mono text-[13px] leading-[1.6] text-ink outline-none"
                  />
                  <div className="flex items-center justify-end gap-2 border-t border-edge px-5 py-3">
                    <button
                      onClick={() => removeDraft(d.id)}
                      className="text-[13px] text-ink-mute hover:text-ink-soft"
                    >
                      Discard
                    </button>
                    <button
                      onClick={() => sendDraft(d.id)}
                      className="rounded-md bg-accent px-3 py-1.5 text-[13px] font-medium text-white hover:bg-accent/90"
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 text-[12px] text-ink-faint">
        Sent items live in each customer's conversation history.{" "}
        <Link href="/customers" className="underline-offset-2 hover:underline">
          Customers →
        </Link>
      </div>
    </div>
  );
}
