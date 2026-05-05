"use client";

import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { SubTabs } from "./sub-tabs";

export function InboxTabs() {
  const pathname = usePathname();
  const draftCount = useStore((s) => s.drafts.length);

  return (
    <SubTabs
      tabs={[
        {
          href: "/",
          label: "Needs your judgment",
          active: pathname === "/" || pathname.startsWith("/inbox/"),
        },
        {
          href: "/drafts",
          label: "Drafts",
          count: draftCount,
          active: pathname === "/drafts",
        },
      ]}
    />
  );
}
