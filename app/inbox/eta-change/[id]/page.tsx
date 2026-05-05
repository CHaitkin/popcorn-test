import { PageHeader } from "@/components/page-header";

export default function EtaChangeDetailPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <PageHeader title="ETA change" subtitle={params.id} />
      <div className="mt-12 text-center text-[13px] text-ink-faint">
        Flow B detail view — to be built next.
      </div>
    </div>
  );
}
