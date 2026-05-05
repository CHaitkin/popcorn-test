import { PageHeader } from "@/components/page-header";

export default function ShortfallDetailPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <PageHeader title="Shortfall decision" subtitle={decodeURIComponent(params.id)} />
      <div className="mt-12 text-center text-[13px] text-ink-faint">
        Flow A detail view — to be built next.
      </div>
    </div>
  );
}
