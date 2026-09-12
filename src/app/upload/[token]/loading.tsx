import { Skeleton } from "@/components/ui/skeleton";

export default function UploadLoading() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Skeleton className="h-10 w-40" />
      <Skeleton className="mt-8 h-96" />
    </div>
  );
}
