"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const ITEMS = [
  { href: "/", label: "Inbox", match: (p: string) => p === "/" || p.startsWith("/inbox") || p === "/drafts" },
  { href: "/allocation", label: "Allocation", match: (p: string) => p.startsWith("/allocation") },
  { href: "/customers", label: "Customers", match: (p: string) => p.startsWith("/customers") },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-edge bg-surface-subtle/85 backdrop-blur">
      <div className="mx-auto flex h-12 max-w-[960px] items-center px-8">
        <nav className="flex items-center gap-6">
          {ITEMS.map((it) => {
            const active = it.match(pathname);
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
    </header>
  );
}
