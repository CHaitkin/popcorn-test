import { PageHeader } from "@/components/page-header";

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <PageHeader title={params.id} subtitle="Customer detail" />
      <div className="mt-12 text-center text-[13px] text-ink-faint">
        Phase 2 — to be built after Inbox review.
      </div>
    </div>
  );
}
