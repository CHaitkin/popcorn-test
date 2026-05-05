"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useStore } from "@/lib/store";

const ITEMS = [
  { href: "/", label: "Inbox" },
  { href: "/containers", label: "Containers" },
  { href: "/customers", label: "Customers" },
];

export function TopNav() {
  const pathname = usePathname();
  const draftCount = useStore((s) => s.drafts.length);

  return (
    <header className="sticky top-0 z-20 border-b border-edge bg-surface-subtle/85 backdrop-blur">
      <div className="mx-auto flex h-12 max-w-[960px] items-center justify-between px-8">
        <div className="flex items-center gap-7">
          <span className="text-[13px] font-semibold tracking-tight text-ink">
            Allocation
          </span>
          <nav className="flex items-center gap-5">
            {ITEMS.map((it) => {
              const active =
                it.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(it.href);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={clsx(
                    "text-[13px] transition-colors",
                    active
                      ? "font-medium text-ink"
                      : "text-ink-mute hover:text-ink-soft",
                  )}
                >
                  {it.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <Link
          href="/drafts"
          className={clsx(
            "flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] transition-colors",
            pathname.startsWith("/drafts")
              ? "bg-accent-soft text-accent"
              : "text-ink-mute hover:bg-surface-muted hover:text-ink-soft",
          )}
        >
          <span>Drafts</span>
          <span
            className={clsx(
              "min-w-[20px] rounded-sm px-1 text-center text-[11px] font-medium tabular-nums",
              draftCount > 0
                ? "bg-accent text-white"
                : "bg-edge text-ink-mute",
            )}
          >
            {draftCount}
          </span>
        </Link>
      </div>
    </header>
  );
}
