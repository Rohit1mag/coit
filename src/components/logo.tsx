import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <Image src="/logo.png" alt="" width={32} height={32} className="size-8" priority />
      COI Tracker
    </span>
  );
}
