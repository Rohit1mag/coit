const HARDCODED_COMPLIMENTARY_EMAILS = ["rohitkota4@gmail.com"];

function complimentaryEmails() {
  const fromEnv = (process.env.COMPLIMENTARY_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...HARDCODED_COMPLIMENTARY_EMAILS, ...fromEnv]);
}

export function isComplimentaryEmail(email: string | null | undefined) {
  return Boolean(email && complimentaryEmails().has(email.trim().toLowerCase()));
}
