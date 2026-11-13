/** Labels and pills shared by the Enquiries list and detail screens. */
export type EnquiryStatus = "new" | "contacted" | "confirmed" | "cancelled";
export type EmailStatus = "pending" | "sent" | "failed" | "not_configured";

export const STATUS: Record<EnquiryStatus, [string, string]> = {
  new: ["cms-pill--busy", "New"],
  contacted: ["cms-pill--draft", "Contacted"],
  confirmed: ["cms-pill--live", "Confirmed"],
  cancelled: ["cms-pill--off", "Cancelled"],
};

export const EMAIL: Record<EmailStatus, [string, string]> = {
  sent: ["cms-pill--live", "Sent"],
  failed: ["cms-pill--error", "Failed"],
  not_configured: ["cms-pill--error", "Not sent (email not set up)"],
  pending: ["cms-pill--off", "Not sent yet"],
};

export function StatusPill({ status }: { status: EnquiryStatus }) {
  const [cls, label] = STATUS[status];
  return <span className={`cms-pill ${cls}`}>{label}</span>;
}

export function EmailPill({ status, label }: { status: EmailStatus; label?: string }) {
  const [cls, text] = EMAIL[status];
  return <span className={`cms-pill ${cls}`}>{label ? `${label}: ${status === "sent" ? "sent" : text.toLowerCase()}` : text}</span>;
}

/** "Tue, 10 Dec 2026" */
export function arrivalLabel(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return y ? new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d))) : iso;
}

/** wa.me number from what the customer typed ("+62 812-…" → "62812…", a leading 0 counts as Indonesia). */
export const waNumber = (phone: string) => phone.replace(/[^\d]/g, "").replace(/^0/, "62");
