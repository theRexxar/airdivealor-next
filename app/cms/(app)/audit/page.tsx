"use client";

import { useCallback, useEffect, useState } from "react";
import { useCmsUser } from "@/components/cms/CmsUser";
import { PageHead } from "@/components/cms/Shell";
import { useToast } from "@/components/cms/Toast";
import { Button } from "@/components/ui";
import { api, ApiError, fmtDate } from "@/lib/cms/client";
import { Forbidden } from "../Forbidden";

interface Entry { id: number; action: string; target: string; meta: Record<string, unknown> | null; ip: string | null; createdAt: string; user: string | null; email: string | null }

const LABELS: Record<string, string> = {
  "auth.login": "Signed in", "auth.logout": "Signed out", "auth.login_failed": "Failed sign-in", "auth.reset_requested": "Asked for a password reset",
  "auth.password_reset": "Reset password", "email.test_sent": "Sent a test email", "auth.invite_accepted": "Accepted invitation", "auth.password_changed": "Changed password",
  "user.invited": "Invited user", "user.invite_resent": "Resent invitation", "user.updated": "Updated user", "user.deleted": "Deleted user",
  "role.created": "Created role", "role.updated": "Updated role", "role.deleted": "Deleted role",
  "home.draft_saved": "Saved Home draft", "home.draft_discarded": "Discarded Home draft", "home.published": "Published Home", "home.layout_changed": "Changed Home section order",
  "page.draft_saved": "Saved page draft", "page.draft_discarded": "Discarded page draft", "page.published": "Published page", "page.layout_changed": "Changed section order",
  "item.created": "Created item", "item.draft_saved": "Saved item draft", "item.draft_discarded": "Discarded item draft", "item.published": "Published item",
  "item.unpublished": "Unpublished item", "item.hidden": "Hid item", "item.shown": "Showed item", "item.reordered": "Reordered items", "item.deleted": "Deleted item",
  "media.upload_started": "Started upload", "media.uploaded": "Uploaded file", "media.updated": "Edited file", "media.deleted": "Deleted file",
};

export default function AuditPage() {
  const { can } = useCmsUser();
  const toast = useToast();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [next, setNext] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (before?: number) => {
    setLoading(true);
    try {
      const r = await api<{ entries: Entry[]; next: number | null }>(`/api/cms/audit${before ? `?before=${before}` : ""}`);
      setEntries((cur) => (before ? [...cur, ...r.entries] : r.entries));
      setNext(r.next);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Could not load the log.", true);
    } finally {
      setLoading(false);
    }
  }, [toast]);
  useEffect(() => void load(), [load]);

  if (!can("audit.view")) return <Forbidden />;
  return (
    <>
      <PageHead title="Activity log" sub="Who changed what, newest first." />
      <div className="cms-card">
        <div className="cms-table__wrap">
          <table className="cms-table">
            <thead><tr><th>When</th><th>Who</th><th>What</th><th>Details</th></tr></thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className="cms-muted" style={{ whiteSpace: "nowrap" }}>{fmtDate(e.createdAt)}</td>
                  <td>{e.user ?? <span className="cms-muted">—</span>}</td>
                  <td>{LABELS[e.action] ?? e.action}</td>
                  <td className="cms-muted">{e.target}{e.ip ? ` · ${e.ip}` : ""}</td>
                </tr>
              ))}
              {!entries.length && !loading && <tr><td colSpan={4} className="cms-empty">Nothing yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {next && <div><Button variant="secondary" disabled={loading} onClick={() => load(next)}>Load older</Button></div>}
    </>
  );
}
