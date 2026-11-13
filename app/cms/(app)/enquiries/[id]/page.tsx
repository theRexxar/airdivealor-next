"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useCmsUser } from "@/components/cms/CmsUser";
import { PageHead } from "@/components/cms/Shell";
import { useToast } from "@/components/cms/Toast";
import { Button, ButtonLink, Select, Textarea } from "@/components/ui";
import { api, ApiError, fmtDate } from "@/lib/cms/client";
import { Forbidden } from "../../Forbidden";
import { arrivalLabel, EmailPill, STATUS, StatusPill, waNumber, type EmailStatus, type EnquiryStatus } from "../shared";

interface Enquiry {
  id: number;
  status: EnquiryStatus;
  lang: "en" | "id";
  currency: "IDR" | "USD";
  packageName: { en: string; id: string };
  arrival: string;
  divers: number;
  cert: string;
  camera: boolean;
  name: string;
  email: string;
  phone: string;
  message: string;
  notes: string;
  ip: string | null;
  createdAt: string;
  updatedAt: string;
  updatedByName: string | null;
  teamEmail: EmailStatus;
  teamEmailTo: string;
  teamEmailId: string | null;
  teamEmailError: string | null;
  teamEmailAt: string | null;
  customerEmail: EmailStatus;
  customerEmailId: string | null;
  customerEmailError: string | null;
  customerEmailAt: string | null;
}
interface Data {
  enquiry: Enquiry;
  estimate: string;
  estimateIdr: string;
  deposit: string;
  summary: string;
  can: { manage: boolean; delete: boolean };
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="cms-kv">
      <span>{label}</span>
      <span>{children}</span>
    </div>
  );
}

/** One booking enquiry: the trip, the customer, the emails, and the team's status and notes. */
export default function EnquiryPage() {
  const { id } = useParams<{ id: string }>();
  const { can } = useCmsUser();
  const toast = useToast();
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [missing, setMissing] = useState(false);
  const [status, setStatus] = useState<EnquiryStatus>("new");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api<Data>(`/api/cms/enquiries/${id}`);
      setData(d);
      setStatus(d.enquiry.status);
      setNotes(d.enquiry.notes);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setMissing(true);
      else toast(e instanceof ApiError ? e.message : "Could not load this enquiry.", true);
    }
  }, [id, toast]);
  useEffect(() => void load(), [load]);

  if (!can("enquiries.view")) return <Forbidden />;
  if (missing) return <div className="cms-card"><div className="cms-empty">This enquiry doesn't exist (or was deleted).</div></div>;
  if (!data) return <div className="cms-card"><div className="cms-empty">Loading…</div></div>;
  const e = data.enquiry;
  const dirty = status !== e.status || notes !== e.notes;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Something went wrong.", true);
    } finally {
      setBusy(false);
    }
  };
  const save = () =>
    run(async () => {
      await api(`/api/cms/enquiries/${e.id}`, { method: "PATCH", body: { status, notes } });
      toast("Saved.");
      await load();
    });
  const resend = (to: "team" | "customer") =>
    run(async () => {
      const r = await api<{ result: { status: EmailStatus; error?: string } }>(`/api/cms/enquiries/${e.id}/resend`, { body: { to } });
      if (r.result.status === "sent") toast(to === "team" ? "Team email sent." : `Copy sent to ${e.email}.`);
      else toast(r.result.error ?? "The email wasn't sent.", true);
      await load();
    });
  const remove = () =>
    confirm(`Delete enquiry #${e.id} from ${e.name} for good? This removes their details from the CMS.`) &&
    run(async () => {
      await api(`/api/cms/enquiries/${e.id}`, { method: "DELETE" });
      toast("Deleted.");
      router.push("/cms/enquiries");
    });

  const greet =
    e.lang === "id"
      ? `Halo ${e.name}, terima kasih atas permintaan Anda untuk ${e.packageName.id || e.packageName.en} mulai ${arrivalLabel(e.arrival)}.`
      : `Hi ${e.name}, thank you for your enquiry for ${e.packageName.en} from ${arrivalLabel(e.arrival)}.`;
  const wa = e.phone ? `https://api.whatsapp.com/send/?phone=${waNumber(e.phone)}&text=${encodeURIComponent(greet)}` : null;
  const mail = `mailto:${e.email}?subject=${encodeURIComponent(`Your Air Dive Alor enquiry #${e.id}: ${e.packageName.en}`)}`;

  const emailCard = (who: "team" | "customer") => {
    const st = who === "team" ? e.teamEmail : e.customerEmail;
    const at = who === "team" ? e.teamEmailAt : e.customerEmailAt;
    const mid = who === "team" ? e.teamEmailId : e.customerEmailId;
    const err = who === "team" ? e.teamEmailError : e.customerEmailError;
    return (
      <div className="cms-email-status" data-who={who}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <strong>{who === "team" ? "To the team" : "Copy to the customer"}</strong>
          <EmailPill status={st} />
        </div>
        <div className="cms-muted">
          {who === "team" ? e.teamEmailTo || "—" : e.email}
          {at && ` · ${fmtDate(at)}`}
          {mid && (
            <>
              <br />
              Brevo id: <code style={{ wordBreak: "break-all" }}>{mid}</code>
            </>
          )}
        </div>
        {err && st !== "sent" && <div className="cms-field__error">{err}</div>}
        {data.can.manage && (
          <div>
            <Button variant={st === "sent" ? "text" : "secondary"} size="small" icon="send" disabled={busy} onClick={() => resend(who)}>
              {st === "sent" ? "Send again" : "Send now"}
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <PageHead
        crumbs={[{ label: "Bookings" }, { href: "/cms/enquiries", label: "Enquiries" }, { label: `#${e.id}` }]}
        title={`#${e.id} · ${e.name}`}
        sub={`Received ${fmtDate(e.createdAt)} from the ${e.lang === "id" ? "Indonesian" : "English"} website.`}
        actions={
          <>
            {wa && (
              <ButtonLink href={wa} external variant="primary" icon="message-circle">
                Reply on WhatsApp
              </ButtonLink>
            )}
            <ButtonLink href={mail} variant="secondary" icon="mail">
              Email {e.name.split(" ")[0]}
            </ButtonLink>
          </>
        }
      />
      <div className="cms-editor">
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <div className="cms-card">
            <div className="cms-card__head">
              <span className="cms-card__title">Trip</span>
              <StatusPill status={e.status} />
            </div>
            <div className="cms-card__body cms-kvs">
              <Row label="Package">{e.packageName.en}</Row>
              <Row label="Arrival">{arrivalLabel(e.arrival)}</Row>
              <Row label="Divers">
                {e.divers} · {e.cert}
              </Row>
              <Row label="Camera">{e.camera ? "Yes, bringing a camera" : "No"}</Row>
              <Row label="Estimate">
                {data.estimate}
                {data.estimate !== data.estimateIdr && <div className="cms-muted">{data.estimateIdr}</div>}
              </Row>
              <Row label="Deposit">{data.deposit}</Row>
            </div>
          </div>
          <div className="cms-card">
            <div className="cms-card__head">
              <span className="cms-card__title">Customer</span>
            </div>
            <div className="cms-card__body cms-kvs">
              <Row label="Name">{e.name}</Row>
              <Row label="Email">
                <a href={mail}>{e.email}</a>
              </Row>
              <Row label="WhatsApp / phone">{wa ? <a href={wa} target="_blank" rel="noopener noreferrer">{e.phone}</a> : <span className="cms-muted">Not given</span>}</Row>
              <Row label="Language">{e.lang === "id" ? "Bahasa Indonesia" : "English"}</Row>
              <Row label="Message">{e.message.trim() ? <span style={{ whiteSpace: "pre-wrap" }}>{e.message}</span> : <span className="cms-muted">None</span>}</Row>
            </div>
          </div>
        </div>
        <aside className="cms-editor__side">
          <div className="cms-card">
            <div className="cms-card__head">
              <span className="cms-card__title">Follow-up</span>
              {dirty && <span className="cms-pill cms-pill--draft">Not saved</span>}
            </div>
            <div className="cms-card__body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Select
                id="enquiry-status"
                label="Status"
                value={status}
                disabled={!data.can.manage}
                onChange={(ev) => setStatus(ev.target.value as EnquiryStatus)}
                options={Object.entries(STATUS).map(([value, [, label]]) => ({ value, label }))}
              />
              <Textarea id="enquiry-notes" label="Notes for the team" rows={5} readOnly={!data.can.manage} placeholder="e.g. Quoted on WhatsApp, waiting for the deposit." value={notes} onChange={(ev) => setNotes(ev.target.value)} />
              {data.can.manage && (
                <Button variant="primary" disabled={busy || !dirty} onClick={save}>
                  Save
                </Button>
              )}
              {e.updatedByName && <div className="cms-muted">Last changed by {e.updatedByName}, {fmtDate(e.updatedAt)}</div>}
            </div>
          </div>
          <div className="cms-card">
            <div className="cms-card__head">
              <span className="cms-card__title">Emails</span>
            </div>
            <div className="cms-card__body" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {emailCard("team")}
              {emailCard("customer")}
            </div>
          </div>
          {data.can.delete && (
            <div className="cms-card">
              <div className="cms-card__body">
                <Button variant="text" icon="trash-2" disabled={busy} onClick={remove}>
                  Delete enquiry
                </Button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
