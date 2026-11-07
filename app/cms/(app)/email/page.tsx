"use client";

import { useEffect, useState } from "react";
import { useCmsUser } from "@/components/cms/CmsUser";
import { PageHead } from "@/components/cms/Shell";
import { useToast } from "@/components/cms/Toast";
import { Alert, Button } from "@/components/ui";
import { api, ApiError } from "@/lib/cms/client";
import { Forbidden } from "../Forbidden";

interface Template {
  key: string;
  label: string;
  subject: string;
  html: string;
  text: string;
}
interface Settings {
  configured: boolean;
  from: { email: string; name: string };
  siteUrl: string;
  me: { email: string };
  templates: Template[];
}

const WHEN: Record<string, string> = {
  invite: "Sent when an administrator invites a user, or uses “Resend invite”. The link sets the password and expires in 7 days.",
  reset: "Sent from “Forgot password”. The link expires in 1 hour; asking again cancels the previous link.",
  changed: "Sent after a password reset, or a password change in Account settings, so the owner notices if it wasn't them.",
  test: "Only sent from this page, to check that email delivery works.",
};

/** Email settings: delivery status, template previews and test sends. */
export default function EmailPage() {
  const { can } = useCmsUser();
  const toast = useToast();
  const [data, setData] = useState<Settings | null>(null);
  const [active, setActive] = useState("invite");
  const [view, setView] = useState<"html" | "text">("html");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<Settings>("/api/cms/email")
      .then(setData)
      .catch((e) => toast(e instanceof ApiError ? e.message : "Could not load the email settings.", true));
  }, [toast]);

  if (!can("users.manage")) return <Forbidden />;
  if (!data) return <div className="cms-card"><div className="cms-empty">Loading…</div></div>;
  const t = data.templates.find((x) => x.key === active) ?? data.templates[0];

  const sendTest = async () => {
    setBusy(true);
    try {
      const r = await api<{ to: string; delivered: boolean }>("/api/cms/email/test", { body: { template: t.key } });
      toast(r.delivered ? `Sent “${t.label}” to ${r.to}. Check the inbox (and spam folder).` : `No email service is set up, so the email was written to the server log instead of being sent.`, !r.delivered);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Sending failed.", true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHead title="Email" sub="The emails the CMS sends for invitations and passwords. Each one has English and Indonesian text." crumbs={[{ label: "Settings" }, { label: "Email" }]} />

      <div className="cms-card" style={{ marginBottom: 24 }}>
        <div className="cms-card__head">
          <span className="cms-card__title">Delivery</span>
          {data.configured ? <span className="cms-pill cms-pill--live">Brevo connected</span> : <span className="cms-pill cms-pill--draft">Not set up</span>}
        </div>
        <div className="cms-card__body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="cms-muted">
            Sender: <strong>{data.from.name}</strong> &lt;{data.from.email}&gt;
            <br />
            Links point to: <strong>{data.siteUrl}</strong>
          </div>
          {!data.configured && (
            <Alert>
              Emails aren't sent yet: they are written to the server log. Set <code>BREVO_API_KEY</code> on the web service, and verify the sender domain in Brevo (SPF and DKIM), so invitations and
              password emails reach people.
            </Alert>
          )}
          {data.configured && !/^https:\/\//.test(data.siteUrl) && <Alert>SITE_URL doesn't start with https://, so links in emails may not work for people outside this server.</Alert>}
        </div>
      </div>

      <div className="cms-card">
        <div className="cms-card__head" style={{ flexWrap: "wrap", gap: 12 }}>
          <div className="chips" role="tablist" aria-label="Template">
            {data.templates.map((x) => (
              <Button key={x.key} role="tab" aria-selected={x.key === t.key} variant={x.key === t.key ? "primary" : "secondary"} size="small" onClick={() => setActive(x.key)}>
                {x.label}
              </Button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
            <Button variant="text" size="small" onClick={() => setView(view === "html" ? "text" : "html")}>
              {view === "html" ? "Show plain text" : "Show design"}
            </Button>
            <Button variant="secondary" size="small" icon="send" disabled={busy} onClick={sendTest}>
              Send to me
            </Button>
          </div>
        </div>
        <div className="cms-card__body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="cms-muted">{WHEN[t.key]}</div>
          <div>
            <span className="cms-muted">Subject: </span>
            <strong>{t.subject}</strong>
          </div>
          {view === "html" ? (
            <iframe title={`${t.label} preview`} sandbox="" srcDoc={t.html} style={{ width: "100%", height: 760, border: "1px solid var(--neutral-200, #e9e9eb)", borderRadius: 8, background: "#f4f5f7" }} />
          ) : (
            <pre style={{ whiteSpace: "pre-wrap", margin: 0, padding: 16, background: "#f8f9fb", border: "1px solid #e9e9eb", borderRadius: 8, font: "13px/1.55 ui-monospace, Menlo, monospace" }}>{t.text}</pre>
          )}
          <div className="cms-muted" style={{ fontSize: 12 }}>
            Preview with sample names. The button links in previews and test emails don't open a real reset page. “Send to me” goes to {data.me.email}.
          </div>
        </div>
      </div>
    </>
  );
}
