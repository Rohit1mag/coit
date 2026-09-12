import { Skeleton } from "@/components/ui/skeleton";

export default function ReviewLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-40" />
      <div className="flex min-h-[calc(100vh-12rem)] flex-col gap-4 lg:flex-row">
        <Skeleton className="min-h-[420px] lg:w-[60%]" />
        <Skeleton className="min-h-[420px] lg:w-[40%]" />
      </div>
    </div>
  );
}
