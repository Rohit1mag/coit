"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { userFacingError } from "@/lib/user-error";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Dashboard failed to load</AlertTitle>
      <AlertDescription className="flex flex-col gap-3">
        <span>{userFacingError(error)}</span>
        <Button variant="outline" onClick={reset} className="w-fit">
          Try again
        </Button>
      </AlertDescription>
    </Alert>
  );
}
