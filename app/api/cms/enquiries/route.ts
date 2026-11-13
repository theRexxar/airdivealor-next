import { listEnquiries } from "@/lib/server/enquiry-service";
import { handle, ok, requireUser } from "@/lib/server/http";

/** Booking enquiries, newest first, 50 per page (?q=, ?status=, ?email=problem, ?before=<id>). */
export const GET = handle(async (req) => {
  const me = await requireUser("enquiries.view");
  const p = new URL(req.url).searchParams;
  const r = await listEnquiries({ q: p.get("q") ?? "", status: p.get("status") ?? "", email: p.get("email") === "problem" ? "problem" : "", before: Number(p.get("before")) || 0 });
  return ok({
    ...r,
    enquiries: r.enquiries.map((e) => ({
      id: e.id, status: e.status, createdAt: e.createdAt, name: e.name, email: e.email, phone: e.phone, packageName: e.packageName, arrival: e.arrival, divers: e.divers,
      teamEmail: e.teamEmail, customerEmail: e.customerEmail, hasMessage: !!e.message.trim(), hasNotes: !!e.notes.trim(),
    })),
    can: { manage: me.permissions.has("enquiries.manage"), delete: me.permissions.has("enquiries.delete") },
  });
});
