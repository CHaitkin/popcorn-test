import Link from "next/link";
import clsx from "clsx";

// Shared visual frame for inbox items. Variants control how loud the card is.
// `urgent`     — shortfall, top-8: warning edge, drives the eye
// `attention`  — ETA changes, key-tier shortfalls
// `calm`       — awaiting reply, weekly digest, no-action ETA shifts
// `muted`      — rep-handled shortfalls, empty-state slots
// `empty`      — calm "no opportunities" placeholder

export type CardVariant = "urgent" | "attention" | "calm" | "muted" | "empty";

export function InboxCard({
  href,
  variant,
  eyebrow,
  headline,
  meta,
  children,
  action,
}: {
  href?: string;
  variant: CardVariant;
  eyebrow: React.ReactNode;
  headline?: React.ReactNode;
  meta?: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  const styles = clsx(
    "group relative block rounded-md border bg-surface px-5 py-4 transition-colors",
    variant === "urgent" &&
      "border-warn-edge bg-warn-soft/40 hover:bg-warn-soft/70",
    variant === "attention" &&
      "border-edge-strong hover:border-ink-faint",
    variant === "calm" && "border-edge hover:border-edge-strong",
    variant === "muted" &&
      "border-edge bg-surface-subtle hover:border-edge-strong",
    variant === "empty" && "border-dashed border-edge bg-transparent",
  );

  const inner = (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2.5 text-[11px] uppercase tracking-micro">
          <span
            className={clsx(
              "font-medium",
              variant === "urgent" && "text-warn",
              variant === "attention" && "text-ink-soft",
              variant === "calm" && "text-ink-mute",
              variant === "muted" && "text-ink-mute",
              variant === "empty" && "text-ink-faint",
            )}
          >
            {eyebrow}
          </span>
          {meta && (
            <span className="font-normal normal-case tracking-normal text-ink-faint">
              {meta}
            </span>
          )}
        </div>
        {action}
      </div>
      {headline && (
        <div
          className={clsx(
            "mt-1 text-[14px]",
            variant === "empty" ? "text-ink-mute" : "text-ink",
            variant === "muted" && "text-ink-soft",
          )}
        >
          {headline}
        </div>
      )}
      {children && (
        <div className="mt-1.5 text-[13px] text-ink">{children}</div>
      )}
    </>
  );

  if (!href) {
    return <div className={styles}>{inner}</div>;
  }
  return (
    <Link href={href} className={styles}>
      {inner}
    </Link>
  );
}
