import { InvoicesTableSkeleton } from "@/app/ui/skeletons";

export default function Loading() {
  return (
    <div className="w-full" role="status" aria-label="Loading invoices">
      <div className="h-8 w-32 animate-pulse rounded bg-gray-100" />
      <div className="mt-4 h-10 w-full animate-pulse rounded bg-gray-100 md:mt-8" />
      <InvoicesTableSkeleton />
    </div>
  );
}