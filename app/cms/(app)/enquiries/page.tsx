"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useCmsUser } from "@/components/cms/CmsUser";
import { PageHead } from "@/components/cms/Shell";
import { useToast } from "@/components/cms/Toast";
import { Button, Icon, Input, Select } from "@/components/ui";
import { api, ApiError, fmtDate } from "@/lib/cms/client";
import { Forbidden } from "../Forbidden";
import { arrivalLabel, EmailPill, STATUS, StatusPill, type EmailStatus, type EnquiryStatus } from "./shared";

interface Row {
  id: number;
  status: EnquiryStatus;
  createdAt: string;
  name: string;
  email: string;
  phone: string;
  packageName: { en: string; id: string };
  arrival: string;
  divers: number;
  teamEmail: EmailStatus;
  customerEmail: EmailStatus;
  hasMessage: boolean;
  hasNotes: boolean;
}

/** Booking enquiries from the Home page form, newest first. */
export default function EnquiriesPage() {
  const { can } = useCmsUser();
  const toast = useToast();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [next, setNext] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (before?: number) => {
      setLoading(true);
      try {
        const p = new URLSearchParams({ q, status, email, ...(before ? { before: String(before) } : {}) });
        const r = await api<{ enquiries: Row[]; next: number | null; counts: Record<string, number> }>(`/api/cms/enquiries?${p}`);
        setRows((cur) => (before && cur ? [...cur, ...r.enquiries] : r.enquiries));
        setNext(r.next);
        setCounts(r.counts);
      } catch (e) {
        toast(e instanceof ApiError ? e.message : "Could not load the enquiries.", true);
      } finally {
        setLoading(false);
      }
    },
    [q, status, email, toast],
  );
  // Search as you type, a moment after the last key.
  useEffect(() => {
    const t = setTimeout(() => void load(), q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  if (!can("enquiries.view")) return <Forbidden />;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return (
    <>
      <PageHead
        crumbs={[{ label: "Bookings" }, { label: "Enquiries" }]}
        title="Enquiries"
        sub="Booking enquiries from the form on the Home page, newest first. Each one shows whether the team email and the customer's copy were delivered."
      />
      <div className="cms-card">
        <div className="cms-card__head">
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", flex: 1 }}>
            <div style={{ flex: "1 1 240px", maxWidth: 360 }}>
              <Input id="q" label="Search" placeholder="Name, email, phone or #number" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div style={{ flex: "0 1 200px" }}>
              <Select
                id="status"
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={[{ value: "", label: "All" }, ...Object.entries(STATUS).map(([value, [, label]]) => ({ value, label: `${label} (${counts[value] ?? 0})` }))]}
              />
            </div>
            <div style={{ flex: "0 1 220px" }}>
              <Select id="email" label="Emails" value={email} onChange={(e) => setEmail(e.target.value)} options={[{ value: "", label: "All" }, { value: "problem", label: "Not delivered" }]} />
            </div>
          </div>
          <span className="cms-muted">
            {counts.new ?? 0} new · {total} in all
          </span>
        </div>
        <div className="cms-table__wrap">
          <table className="cms-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Received</th>
                <th>Customer</th>
                <th>Trip</th>
                <th>Status</th>
                <th>Emails</th>
              </tr>
            </thead>
            <tbody>
              {(rows ?? []).map((r) => (
                <tr key={r.id}>
                  <td className="cms-muted">
                    <Link href={`/cms/enquiries/${r.id}`}>#{r.id}</Link>
                  </td>
                  <td className="cms-muted" style={{ whiteSpace: "nowrap" }}>{fmtDate(r.createdAt)}</td>
                  <td>
                    <Link href={`/cms/enquiries/${r.id}`} style={{ fontWeight: 500, color: "var(--text-default)", textDecoration: "none" }}>
                      {r.name}
                    </Link>
                    <div className="cms-muted">
                      {r.email}
                      {r.phone ? ` · ${r.phone}` : ""}
                    </div>
                  </td>
                  <td>
                    {r.packageName.en}
                    <div className="cms-muted">
                      {arrivalLabel(r.arrival)} · {r.divers} {r.divers === 1 ? "diver" : "divers"}
                      {r.hasMessage && (
                        <>
                          {" · "}
                          <Icon name="message-square" size={12} /> message
                        </>
                      )}
                    </div>
                  </td>
                  <td>
                    <StatusPill status={r.status} />
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
                      <EmailPill status={r.teamEmail} label="Team" />
                      <EmailPill status={r.customerEmail} label="Copy" />
                    </div>
                  </td>
                </tr>
              ))}
              {rows && !rows.length && (
                <tr>
                  <td colSpan={6} className="cms-empty">
                    {q || status || email ? "Nothing matches." : "No enquiries yet. They appear here as soon as someone sends the booking form."}
                  </td>
                </tr>
              )}
              {!rows && (
                <tr>
                  <td colSpan={6} className="cms-empty">Loading…</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {next && (
        <div>
          <Button variant="secondary" disabled={loading} onClick={() => load(next)}>
            Load older
          </Button>
        </div>
      )}
    </>
  );
}
