"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { PageHeader } from "@/components/page-header";
import { findEtaChange, draftEtaShiftEmail, EtaChangeRow } from "@/lib/eta-change";
import { fmtDate, fmtYards } from "@/lib/format";
import { TODAY } from "@/lib/data";
import { useStore } from "@/lib/store";

export default function EtaChangeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const view = useMemo(() => findEtaChange(params.id), [params.id]);

  const upsertDraft = useStore((s) => s.upsertDraft);
  const sendDrafts = useStore((s) => s.sendDrafts);
  const resolveEtaChange = useStore((s) => s.resolveEtaChange);

  // Per-row draft state (subject + body + edited flag).
  const initialDrafts = useMemo(() => {
    if (!view) return {};
    const m: Record<string, { subject: string; body: string }> = {};
    for (const row of view.rows.filter((r) => r.affected)) {
      const d = draftEtaShiftEmail(row, view.containerId);
      m[draftKey(row)] = d;
    }
    return m;
  }, [view]);

  const [drafts, setDrafts] = useState(initialDrafts);

  if (!view) {
    return (
      <div>
        <Link href="/" className="text-[12px] text-ink-mute hover:text-ink-soft">
          ← Inbox
        </Link>
        <div className="mt-12 text-center text-[14px] text-ink-mute">
          No active ETA shift on {params.id}.
        </div>
      </div>
    );
  }

  const affected = view.rows.filter((r) => r.affected);
  const unaffected = view.rows.filter((r) => !r.affected);

  function updateDraft(key: string, field: "subject" | "body", value: string) {
    setDrafts((d) => ({
      ...d,
      [key]: { ...d[key], [field]: value },
    }));
  }

  function approveAll() {
    if (!view) return;
    if (affected.length === 0) {
      // No drafts to send — just acknowledge the shift and clear the card.
      resolveEtaChange(view.containerId);
      router.push("/");
      return;
    }
    const ids: string[] = [];
    for (const row of affected) {
      const k = draftKey(row);
      const d = drafts[k];
      const id = `draft-eta-${view.containerId}-${row.orderId}-${row.customerId}-${row.sku}`;
      upsertDraft({
        id,
        kind: "eta-change",
        customerId: row.customerId,
        customerName: row.customerName,
        subject: d.subject,
        body: d.body,
        containerId: view.containerId,
        createdAt: TODAY,
      });
      ids.push(id);
    }
    sendDrafts(ids);
    resolveEtaChange(view.containerId);
    router.push("/");
  }

  return (
    <div>
      <Link href="/" className="text-[12px] text-ink-mute hover:text-ink-soft">
        ← Inbox
      </Link>
      <PageHeader
        title={`${view.containerId} · ETA shift`}
        subtitle={`${fmtDate(view.fromEta)} → ${fmtDate(view.toEta)}`}
      />

      {/* Filter summary — the design's POV doing visible work. */}
      <section className="mb-7 rounded-md border border-edge bg-surface px-5 py-4">
        <h2 className="text-[11px] font-medium uppercase tracking-micro text-ink-mute">
          Who needs to know
        </h2>
        <div className="mt-2 flex items-baseline gap-6 text-[13px]">
          <div>
            <span className="text-[18px] font-semibold tabular-nums text-ink">
              {view.rows.length}
            </span>
            <span className="ml-2 text-ink-mute">
              order{view.rows.length === 1 ? "" : "s"} on this container
            </span>
          </div>
          <div>
            <span
              className={clsx(
                "text-[18px] font-semibold tabular-nums",
                view.affectedCount > 0 ? "text-warn" : "text-ink-faint",
              )}
            >
              {view.affectedCount}
            </span>
            <span className="ml-2 text-ink-mute">need notification</span>
          </div>
          <div>
            <span className="text-[18px] font-semibold tabular-nums text-ink-soft">
              {view.unaffectedCount}
            </span>
            <span className="ml-2 text-ink-mute">still on time — no draft</span>
          </div>
        </div>
        {view.affectedCount === 0 && (
          <p className="mt-3 text-[12px] text-ink-mute">
            The new arrival ({fmtDate(view.toEta)}) is still on or before every
            promised ETA on this container. No customer-facing emails generated.
          </p>
        )}
      </section>

      {/* Affected — drafts editable */}
      {affected.length > 0 && (
        <section className="mb-9">
          <h2 className="mb-3 text-[11px] font-medium uppercase tracking-micro text-ink-mute">
            Drafts ready ({affected.length})
          </h2>
          <ul className="space-y-3">
            {affected.map((row) => (
              <li
                key={draftKey(row)}
                className="rounded-md border border-edge-strong bg-surface"
              >
                <div className="flex items-baseline justify-between border-b border-edge px-5 py-3">
                  <div>
                    <div className="text-[13px] font-medium text-ink">
                      {row.customerName}
                    </div>
                    <div className="text-[12px] text-ink-mute">
                      Order #{row.orderId} · {row.sku} · {fmtYards(row.qty)}
                    </div>
                  </div>
                  <div className="text-right text-[12px]">
                    <span className="text-ink-mute">Promised </span>
                    <span className="font-medium text-ink">
                      {fmtDate(row.promisedEta)}
                    </span>
                    <span className="mx-1.5 text-ink-faint">·</span>
                    <span className="text-warn">
                      now {fmtDate(row.newArrival)}
                    </span>
                  </div>
                </div>
                <div className="px-5 py-3">
                  <input
                    value={drafts[draftKey(row)].subject}
                    onChange={(e) =>
                      updateDraft(draftKey(row), "subject", e.target.value)
                    }
                    className="block w-full bg-transparent text-[14px] font-medium text-ink outline-none"
                  />
                </div>
                <textarea
                  value={drafts[draftKey(row)].body}
                  onChange={(e) =>
                    updateDraft(draftKey(row), "body", e.target.value)
                  }
                  rows={9}
                  className="block w-full resize-y border-t border-edge bg-transparent px-5 py-3 font-mono text-[13px] leading-[1.6] text-ink outline-none"
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Unaffected — visibly explained, no drafts */}
      {unaffected.length > 0 && (
        <section className="mb-9">
          <h2 className="mb-3 text-[11px] font-medium uppercase tracking-micro text-ink-mute">
            Still on time — filtered out ({unaffected.length})
          </h2>
          <ul className="rounded-md border border-dashed border-edge bg-transparent">
            {unaffected.map((row) => (
              <li
                key={draftKey(row)}
                className="grid grid-cols-12 items-baseline gap-3 border-b border-edge px-5 py-2.5 text-[12px] last:border-b-0"
              >
                <div className="col-span-4 text-ink-soft">{row.customerName}</div>
                <div className="col-span-3 tabular-nums text-ink-mute">
                  #{row.orderId} · {row.sku}
                </div>
                <div className="col-span-3 tabular-nums text-ink-mute">
                  Promised {fmtDate(row.promisedEta)}
                </div>
                <div className="col-span-2 text-right tabular-nums text-ink-faint">
                  Arrives {fmtDate(row.newArrival)}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex items-center justify-end gap-2">
        <Link
          href="/"
          className="rounded-md px-3 py-1.5 text-[13px] text-ink-mute hover:text-ink-soft"
        >
          Back
        </Link>
        <button
          onClick={approveAll}
          className="rounded-md bg-accent px-3.5 py-1.5 text-[13px] font-medium text-white hover:bg-accent/90"
        >
          {affected.length === 0
            ? "Acknowledge shift"
            : `Approve & send ${affected.length}`}
        </button>
      </div>
    </div>
  );
}

function draftKey(row: EtaChangeRow): string {
  return `${row.orderId}|${row.customerId}|${row.sku}`;
}
