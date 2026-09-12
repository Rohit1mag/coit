import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-40" />
      <Skeleton className="h-48" />
    </div>
  );
}
