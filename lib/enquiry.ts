/**
 * The booking enquiry from the Home page form: shared by the form (checks before sending) and the server
 * (the real checks). No server-only imports here.
 */
import { z } from "zod";

export const CERTS = ["Not certified yet", "Open Water", "Advanced", "Rescue or higher", "Dive professional"] as const;
export const MAX_DIVERS = 50;
export const MAX_MESSAGE = 2000;

/** Today as YYYY-MM-DD in a time zone (the browser's when none is given). */
export function isoToday(timeZone?: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

/**
 * The earliest arrival date accepted: today, wherever the visitor is. The server uses the earliest time zone
 * on Earth (UTC−12), so a visitor whose "today" is behind Alor's (WITA, UTC+8) is never refused.
 */
export const earliestArrival = () => isoToday("Etc/GMT+12");

const PHONE = /^\+?[\d\s().-]{6,24}$/;

export const enquirySchema = z.object({
  lang: z.enum(["en", "id"]),
  currency: z.enum(["IDR", "USD"]),
  pkg: z.string().trim().min(1).max(60),
  arrival: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date")
    .refine((d) => d >= earliestArrival(), "past")
    .refine((d) => d <= `${Number(isoToday("Etc/GMT+12").slice(0, 4)) + 3}-12-31`, "far"),
  divers: z.number().int().min(1, "divers").max(MAX_DIVERS, "divers"),
  cert: z.enum(CERTS),
  camera: z.boolean(),
  name: z.string().trim().min(1, "required").max(100),
  email: z.string().trim().max(200).email("email"),
  phone: z.union([z.literal(""), z.string().trim().max(30).regex(PHONE, "phone")]),
  message: z.string().trim().max(MAX_MESSAGE, "long"),
  /** Left empty by people; bots that fill every field are ignored. */
  website: z.string().max(200).optional(),
});
export type Enquiry = z.infer<typeof enquirySchema>;
export type EnquiryField = "arrival" | "divers" | "name" | "email" | "phone" | "message";

/** The form's own checks, with the same rules as the server. Returns the first problem per field. */
export function checkEnquiry(e: Pick<Enquiry, EnquiryField>, today = isoToday()): Partial<Record<EnquiryField, string>> {
  const out: Partial<Record<EnquiryField, string>> = {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.arrival)) out.arrival = "Choose your arrival date.";
  else if (e.arrival < today) out.arrival = "The arrival date can't be in the past.";
  if (!Number.isInteger(e.divers) || e.divers < 1) out.divers = "Enter at least 1 diver.";
  else if (e.divers > MAX_DIVERS) out.divers = `For more than ${MAX_DIVERS} divers, message us on WhatsApp.`;
  if (!e.name.trim()) out.name = "Enter your name.";
  if (!e.email.trim()) out.email = "Enter your email address.";
  else if (!z.string().email().safeParse(e.email.trim()).success) out.email = "Enter a valid email address, e.g. you@email.com.";
  if (e.phone.trim() && !PHONE.test(e.phone.trim())) out.phone = "Enter a phone number with country code, e.g. +62 812 3456 7890.";
  if (e.message.length > MAX_MESSAGE) out.message = `Keep the message under ${MAX_MESSAGE} characters.`;
  return out;
}
