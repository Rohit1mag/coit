"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-full flex-col items-center justify-center gap-3 p-8">
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="text-sm text-neutral-600">{error.message}</p>
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
