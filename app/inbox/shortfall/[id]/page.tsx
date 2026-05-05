"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { PageHeader } from "@/components/page-header";
import { findShortfallById, draftSplitEmail, draftHoldEmail } from "@/lib/shortfall";
import { fmtDate, fmtYards, fmtUsd, daysFromToday } from "@/lib/format";
import { TODAY, SKU_NAMES } from "@/lib/data";
import { useStore } from "@/lib/store";

export default function ShortfallDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const id = decodeURIComponent(params.id);
  const decision = useMemo(() => findShortfallById(id), [id]);

  const upsertDraft = useStore((s) => s.upsertDraft);
  const removeDraft = useStore((s) => s.removeDraft);
  const sendDraft = useStore((s) => s.sendDraft);
  const resolveShortfall = useStore((s) => s.resolveShortfall);
  const draft = useStore((s) => s.drafts.find((d) => d.shortfallId === id));

  const [choice, setChoice] = useState<"split" | "hold" | null>(
    draft ? (draft.subject.includes("split") ? "split" : "hold") : null,
  );
  const [body, setBody] = useState<string>(draft?.body ?? "");
  const [subject, setSubject] = useState<string>(draft?.subject ?? "");

  if (!decision) {
    return (
      <div>
        <Link href="/" className="text-[12px] text-ink-mute hover:text-ink-soft">
          ← Inbox
        </Link>
        <div className="mt-12 text-center text-[14px] text-ink-mute">
          Shortfall already resolved or not found.
        </div>
      </div>
    );
  }

  const os = decision.orderState;

  function pick(kind: "split" | "hold") {
    const drafted = kind === "split"
      ? draftSplitEmail(decision!)
      : draftHoldEmail(decision!);
    setChoice(kind);
    setSubject(drafted.subject);
    setBody(drafted.body);
    upsertDraft({
      id: `draft-shortfall-${id}`,
      kind: "shortfall-question",
      customerId: os.order.customerId,
      customerName: os.customerName,
      subject: drafted.subject,
      body: drafted.body,
      shortfallId: id,
      createdAt: TODAY,
    });
  }

  function discard() {
    removeDraft(`draft-shortfall-${id}`);
    setChoice(null);
    setSubject("");
    setBody("");
  }

  function send() {
    if (!choice) return;
    // Persist edited content to the draft, then send.
    upsertDraft({
      id: `draft-shortfall-${id}`,
      kind: "shortfall-question",
      customerId: os.order.customerId,
      customerName: os.customerName,
      subject,
      body,
      shortfallId: id,
      createdAt: TODAY,
    });
    sendDraft(`draft-shortfall-${id}`);
    resolveShortfall({
      id,
      customerId: os.order.customerId,
      customerName: os.customerName,
      subject,
      sentAt: TODAY,
    });
    router.push("/");
  }

  return (
    <div>
      <Link href="/" className="text-[12px] text-ink-mute hover:text-ink-soft">
        ← Inbox
      </Link>
      <PageHeader
        title={`${os.customerName} · shortfall`}
        subtitle={`${os.order.sku} — ${SKU_NAMES[os.order.sku]}`}
      />

      {/* Situation */}
      <section className="mb-8 rounded-md border border-edge bg-surface px-5 py-4">
        <h2 className="text-[11px] font-medium uppercase tracking-micro text-ink-mute">
          Situation
        </h2>
        <ul className="mt-3 space-y-2 text-[13px] text-ink">
          <li>
            <span className="font-medium">{os.customerName}</span> ordered{" "}
            <span className="font-medium tabular-nums">
              {fmtYards(os.order.qty)}
            </span>{" "}
            of {os.order.sku}, promised{" "}
            <span className="font-medium">{fmtDate(os.order.promisedEta)}</span>{" "}
            <span className="text-ink-mute">
              ({daysFromToday(os.order.promisedEta) > 0
                ? `in ${daysFromToday(os.order.promisedEta)} days`
                : "today/past"}
              ).
            </span>
          </li>
          {decision.earlyContainerId && decision.earlyEta && (
            <li>
              <span className="font-medium">{decision.earlyContainerId}</span>{" "}
              ({fmtDate(decision.earlyEta)}):{" "}
              <span className="tabular-nums">
                {fmtYards(decision.earlyAllocYards)}
              </span>{" "}
              available after top-priority allocation.
            </li>
          )}
          <li>
            <span className="font-medium">{decision.catchupContainerId}</span>{" "}
            ({fmtDate(decision.catchupEta)}): enough to cover the full order.
          </li>
        </ul>
      </section>

      {/* Options */}
      <section className="mb-8">
        <h2 className="mb-3 text-[11px] font-medium uppercase tracking-micro text-ink-mute">
          Options
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {decision.split && (
            <OptionCard
              selected={choice === "split"}
              onClick={() => pick("split")}
              title="Split shipment"
              tradeoffPositive={`${fmtYards(decision.split.earlyYards)} ${signed(decision.split.earlyDeltaDays)} on ${fmtDate(decision.split.earlyEta)}`}
              tradeoffNegative={`${fmtYards(decision.split.laterYards)} ${signed(decision.split.laterDeltaDays)} on ${fmtDate(decision.split.laterEta)}`}
              cost={`+ ${fmtUsd(decision.split.shippingFeeUsd)} extra shipping fee`}
            />
          )}
          <OptionCard
            selected={choice === "hold"}
            onClick={() => pick("hold")}
            title="Hold for full"
            tradeoffPositive={`Single shipment, no extra fee`}
            tradeoffNegative={`${fmtYards(decision.hold.yards)} ${signed(decision.hold.deltaDays)} on ${fmtDate(decision.hold.eta)}`}
            cost={null}
          />
        </div>
      </section>

      {/* Draft */}
      {choice && (
        <section>
          <h2 className="mb-3 text-[11px] font-medium uppercase tracking-micro text-ink-mute">
            Draft email · awaits {os.customerName.split(" ")[0]}'s sign-off
          </h2>
          <div className="rounded-md border border-edge bg-surface">
            <div className="border-b border-edge px-5 py-3">
              <label className="block text-[11px] uppercase tracking-micro text-ink-faint">
                Subject
              </label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 w-full bg-transparent text-[14px] font-medium text-ink outline-none"
              />
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={14}
              className="block w-full resize-y bg-transparent px-5 py-4 font-mono text-[13px] leading-[1.6] text-ink outline-none"
            />
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              onClick={discard}
              className="rounded-md px-3 py-1.5 text-[13px] text-ink-mute hover:text-ink-soft"
            >
              Discard
            </button>
            <button
              onClick={send}
              className="rounded-md bg-accent px-3.5 py-1.5 text-[13px] font-medium text-white hover:bg-accent/90"
            >
              Send for confirmation
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function OptionCard({
  selected,
  onClick,
  title,
  tradeoffPositive,
  tradeoffNegative,
  cost,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  tradeoffPositive: string;
  tradeoffNegative: string;
  cost: string | null;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "rounded-md border px-5 py-4 text-left transition-colors",
        selected
          ? "border-accent bg-accent-soft"
          : "border-edge bg-surface hover:border-edge-strong",
      )}
    >
      <div
        className={clsx(
          "text-[14px] font-semibold",
          selected ? "text-accent" : "text-ink",
        )}
      >
        {title}
      </div>
      <ul className="mt-2 space-y-1 text-[13px] text-ink-soft">
        <li>{tradeoffPositive}</li>
        <li>{tradeoffNegative}</li>
        {cost && <li className="text-warn">{cost}</li>}
      </ul>
    </button>
  );
}

function signed(n: number): string {
  if (n === 0) return "on time";
  if (n > 0) return `${n} day${n === 1 ? "" : "s"} late`;
  return `${-n} day${-n === 1 ? "" : "s"} early`;
}
