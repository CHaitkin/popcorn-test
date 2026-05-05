"use client";

import Link from "next/link";
import clsx from "clsx";

export type SubTab = {
  href: string;
  label: string;
  count?: number;
  active: boolean;
};

export function SubTabs({ tabs }: { tabs: SubTab[] }) {
  return (
    <div className="mb-7 flex items-center gap-1 border-b border-edge">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={clsx(
            "relative -mb-px flex items-baseline gap-2 px-3 py-2 text-[13px] transition-colors",
            t.active
              ? "border-b-2 border-ink font-medium text-ink"
              : "border-b-2 border-transparent text-ink-mute hover:text-ink-soft",
          )}
        >
          <span>{t.label}</span>
          {typeof t.count === "number" && (
            <span
              className={clsx(
                "rounded-sm px-1 text-2xs font-medium tabular-nums",
                t.active
                  ? "bg-ink text-surface"
                  : "bg-surface-muted text-ink-mute",
              )}
            >
              {t.count}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
