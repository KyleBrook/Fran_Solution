export const UNLIMITED_EMAILS = ["francielliaguiar@gmail.com"];

export function isUnlimitedEmail(email?: string | null) {
  if (!email) return false;
  return UNLIMITED_EMAILS.includes(email.toLowerCase());
}