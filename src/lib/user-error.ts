const HYDRATION_CODES = new Set(["418", "423", "425"]);

export function userFacingError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  const minified = message.match(/Minified React error #(\d+)/);

  if (minified) {
    if (HYDRATION_CODES.has(minified[1])) {
      return "This page didn’t load cleanly. Refresh, or try a private window if a browser extension is changing the page.";
    }
    return "Something went wrong displaying this page. Refresh and try again.";
  }

  if (message.trim()) return message;
  return "Something went wrong. Refresh and try again.";
}
