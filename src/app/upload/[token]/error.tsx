"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { userFacingError } from "@/lib/user-error";

export default function UploadError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Alert variant="destructive">
        <AlertTitle>This upload page could not load</AlertTitle>
        <AlertDescription className="flex flex-col gap-3">
          <span>{userFacingError(error)}</span>
          <Button variant="outline" onClick={reset} className="w-fit">
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
