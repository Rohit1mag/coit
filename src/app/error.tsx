"use client";

import { userFacingError } from "@/lib/user-error";
import { Button } from "@/components/ui/button";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">{userFacingError(error)}</p>
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
