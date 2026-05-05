"use client";

import { useState } from "react";
import clsx from "clsx";
import { RECENT_ACTIVITY } from "@/lib/activity";

const KIND_LABEL: Record<string, string> = {
  "eta-shift": "ETA shift",
  "qty-change": "Qty change",
  "new-order": "New order",
};

export function RecentChanges() {
  const [open, setOpen] = useState(false);
  const count = RECENT_ACTIVITY.length;

  return (
    <section className="mb-7 rounded-md border border-edge bg-surface">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-baseline justify-between px-5 py-3 text-left transition-colors hover:bg-surface-subtle"
      >
        <div className="flex items-baseline gap-3">
          <span className="text-[11px] font-medium uppercase tracking-micro text-ink-mute">
            Recent changes
          </span>
          <span className="text-[12px] text-ink-faint">
            {count} edit{count === 1 ? "" : "s"} in the last 24h
          </span>
        </div>
        <span className="text-[12px] text-ink-mute">
          {open ? "Hide" : "Show"}
        </span>
      </button>
      {open && (
        <ul className="divide-y divide-edge border-t border-edge">
          {RECENT_ACTIVITY.map((e) => (
            <li
              key={e.at}
              className="grid grid-cols-12 gap-4 px-5 py-3 text-[13px]"
            >
              <div className="col-span-2 text-[12px] tabular-nums text-ink-mute">
                {e.when}
              </div>
              <div className="col-span-2">
                <span
                  className={clsx(
                    "rounded-sm px-1.5 py-0.5 text-2xs font-medium uppercase tracking-micro",
                    e.kind === "eta-shift" && "bg-warn-soft text-warn",
                    e.kind === "qty-change" && "bg-surface-muted text-ink-soft",
                    e.kind === "new-order" && "bg-accent-soft text-accent",
                  )}
                >
                  {KIND_LABEL[e.kind]}
                </span>
              </div>
              <div className="col-span-8">
                <div className="text-ink">{e.summary}</div>
                <div className="mt-0.5 text-[12px] text-ink-mute">
                  {e.detail}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
