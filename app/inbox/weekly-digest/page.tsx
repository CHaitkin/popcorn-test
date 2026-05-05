"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { buildWeeklyDigest, DigestRow } from "@/lib/digest";
import { TODAY } from "@/lib/data";
import { useStore } from "@/lib/store";

export default function WeeklyDigestPage() {
  const router = useRouter();
  const initial = useMemo(() => buildWeeklyDigest(), []);
  const [drafts, setDrafts] = useState<DigestRow[]>(initial);
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const upsertDraft = useStore((s) => s.upsertDraft);
  const sendDrafts = useStore((s) => s.sendDrafts);
  const markDigestSent = useStore((s) => s.markDigestSent);

  function update(idx: number, field: "subject" | "body", value: string) {
    setDrafts((d) => {
      const next = [...d];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  function sendAll() {
    const ids: string[] = [];
    for (const row of drafts) {
      const id = `draft-digest-${row.customerId}`;
      upsertDraft({
        id,
        kind: "weekly-digest",
        customerId: row.customerId,
        customerName: row.customerName,
        subject: row.subject,
        body: row.body,
        createdAt: TODAY,
      });
      ids.push(id);
    }
    sendDrafts(ids);
    markDigestSent();
    router.push("/");
  }

  return (
    <div>
      <Link href="/" className="text-[12px] text-ink-mute hover:text-ink-soft">
        ← Inbox
      </Link>
      <PageHeader
        title="Tuesday digest"
        subtitle={`${drafts.length} customers · pre-drafted ETA roll-ups`}
      />

      <ul className="space-y-2">
        {drafts.map((row, idx) => (
          <li
            key={row.customerId}
            className="rounded-md border border-edge bg-surface"
          >
            <button
              onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
              className="flex w-full items-baseline justify-between px-5 py-3 text-left transition-colors hover:bg-surface-subtle"
            >
              <div>
                <div className="text-[13px] font-medium text-ink">
                  {row.customerName}
                </div>
                <div className="text-[12px] text-ink-mute">{row.subject}</div>
              </div>
              <div className="flex items-baseline gap-3 text-[12px] text-ink-faint">
                <span className="tabular-nums">
                  {row.orderCount} order{row.orderCount === 1 ? "" : "s"}
                </span>
                <span>{openIdx === idx ? "Hide" : "Edit"}</span>
              </div>
            </button>
            {openIdx === idx && (
              <div className="border-t border-edge">
                <div className="px-5 py-3">
                  <input
                    value={row.subject}
                    onChange={(e) => update(idx, "subject", e.target.value)}
                    className="block w-full bg-transparent text-[14px] font-medium text-ink outline-none"
                  />
                </div>
                <textarea
                  value={row.body}
                  onChange={(e) => update(idx, "body", e.target.value)}
                  rows={11}
                  className="block w-full resize-y border-t border-edge bg-transparent px-5 py-3 font-mono text-[13px] leading-[1.6] text-ink outline-none"
                />
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-end gap-2">
        <Link
          href="/"
          className="rounded-md px-3 py-1.5 text-[13px] text-ink-mute hover:text-ink-soft"
        >
          Back
        </Link>
        <button
          onClick={sendAll}
          className="rounded-md bg-accent px-3.5 py-1.5 text-[13px] font-medium text-white hover:bg-accent/90"
        >
          Approve & send all {drafts.length}
        </button>
      </div>
    </div>
  );
}
