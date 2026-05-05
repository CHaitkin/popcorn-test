import { PageHeader } from "@/components/page-header";
import { getAllocation } from "@/lib/allocation";
import { customerById } from "@/lib/data";
import { fmtDate, fmtYards } from "@/lib/format";
import clsx from "clsx";

export default function ContainersPage() {
  const { containerStates } = getAllocation();

  return (
    <div>
      <PageHeader
        title="Containers"
        subtitle="Incoming yardage and current allocation"
      />

      <div className="space-y-7">
        {containerStates.map((cs) => {
          const c = cs.container;
          const shifted = c.originalEta && c.originalEta !== c.eta;
          return (
            <section
              key={c.id}
              className="rounded-md border border-edge bg-surface"
            >
              <header className="flex items-baseline justify-between border-b border-edge px-5 py-3">
                <div className="flex items-baseline gap-3">
                  <h2 className="text-[14px] font-semibold tracking-tight text-ink">
                    {c.id}
                  </h2>
                  {cs.hasShortfall && (
                    <span className="rounded-sm bg-warn-soft px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-micro text-warn">
                      Shortfall
                    </span>
                  )}
                </div>
                <div className="text-[12px] text-ink-mute">
                  {shifted ? (
                    <span>
                      <span className="text-ink-faint line-through">
                        {fmtDate(c.originalEta!)}
                      </span>
                      <span className="mx-1.5 text-ink-faint">→</span>
                      <span className="font-medium text-ink-soft">
                        {fmtDate(c.eta)}
                      </span>
                      <span className="ml-2 text-2xs uppercase tracking-micro text-warn">
                        Shifted
                      </span>
                    </span>
                  ) : (
                    <span>ETA {fmtDate(c.eta)}</span>
                  )}
                </div>
              </header>

              <div className="divide-y divide-edge">
                {cs.perSku.map((line) => (
                  <SkuRow key={line.sku} line={line} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function SkuRow({
  line,
}: {
  line: ReturnType<typeof getAllocation>["containerStates"][number]["perSku"][number];
}) {
  const overallocated = line.yardsAllocated > line.yardsIn;
  return (
    <div className="grid grid-cols-12 gap-4 px-5 py-3.5">
      <div className="col-span-4">
        <div className="text-[13px] font-medium text-ink">{line.sku}</div>
        <div className="text-[12px] text-ink-mute">{line.itemName}</div>
      </div>
      <div className="col-span-2 text-right">
        <div className="tabular-nums text-[13px] text-ink">
          {fmtYards(line.yardsIn)}
        </div>
        <div className="text-2xs uppercase tracking-micro text-ink-faint">in</div>
      </div>
      <div className="col-span-4">
        {line.allocations.length === 0 ? (
          <div className="text-[12px] text-ink-faint">No allocations</div>
        ) : (
          <ul className="space-y-1">
            {line.allocations.map((a, i) => {
              const cust = customerById(a.customerId);
              return (
                <li
                  key={i}
                  className="flex items-baseline justify-between gap-3 text-[12px]"
                >
                  <span className="truncate text-ink-soft">{cust.name}</span>
                  <span
                    className={clsx(
                      "tabular-nums",
                      a.late ? "text-warn" : "text-ink-mute",
                    )}
                  >
                    {fmtYards(a.yards)}
                    {a.late && (
                      <span className="ml-1 text-2xs uppercase tracking-micro">late</span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="col-span-2 text-right">
        <div
          className={clsx(
            "tabular-nums text-[13px]",
            overallocated ? "text-warn" : "text-ink-soft",
            line.yardsUnallocated === 0 && "text-ink-faint",
          )}
        >
          {fmtYards(line.yardsUnallocated)}
        </div>
        <div className="text-2xs uppercase tracking-micro text-ink-faint">
          unallocated
        </div>
      </div>
    </div>
  );
}
