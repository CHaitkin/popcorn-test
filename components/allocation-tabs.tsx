"use client";

import { usePathname } from "next/navigation";
import { SubTabs } from "./sub-tabs";

export function AllocationTabs() {
  const pathname = usePathname();
  return (
    <SubTabs
      tabs={[
        {
          href: "/allocation",
          label: "By container",
          active: pathname === "/allocation",
        },
        {
          href: "/allocation/orders",
          label: "By order",
          active: pathname === "/allocation/orders",
        },
      ]}
    />
  );
}
