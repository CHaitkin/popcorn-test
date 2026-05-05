import { fmtDateLong } from "@/lib/format";
import { TODAY } from "@/lib/data";

export function PageHeader({
  title,
  subtitle,
  showToday,
}: {
  title: string;
  subtitle?: string;
  showToday?: boolean;
}) {
  return (
    <div className="mb-8 flex items-end justify-between">
      <div>
        <h1 className="text-[18px] font-semibold tracking-tight text-ink">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-[13px] text-ink-mute">{subtitle}</p>
        )}
      </div>
      {showToday && (
        <p className="text-[12px] text-ink-faint">
          {fmtDateLong(TODAY)}
        </p>
      )}
    </div>
  );
}
