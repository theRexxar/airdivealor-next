"use client";

import { useCallback, useEffect, useState } from "react";
import { useCmsUser } from "@/components/cms/CmsUser";
import { Modal } from "@/components/cms/Modal";
import { PageHead } from "@/components/cms/Shell";
import { useToast } from "@/components/cms/Toast";
import { Button, Icon, Input } from "@/components/ui";
import { api, ApiError, fmtDate } from "@/lib/cms/client";
import { Forbidden } from "../Forbidden";

interface User { id: number; email: string; name: string; status: "active" | "invited" | "disabled"; lastLoginAt: string | null; createdAt: string; roles: { id: number; name: string }[] }
interface Role { id: number; name: string; description: string; isSystem: boolean }

const STATUS = { active: ["cms-pill--live", "Active"], invited: ["cms-pill--draft", "Invited"], disabled: ["cms-pill--off", "Disabled"] } as const;

export default function UsersPage() {
  const { can, user: me } = useCmsUser();
  const toast = useToast();
  const [users, setUsers] = useState<User[] | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [editing, setEditing] = useState<User | "new" | null>(null);

  const load = useCallback(async () => {
    try {
      const [u, r] = await Promise.all([api<{ users: User[] }>("/api/cms/users"), api<{ roles: Role[] }>("/api/cms/roles")]);
      setUsers(u.users);
      setRoles(r.roles);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Could not load users.", true);
    }
  }, [toast]);
  useEffect(() => void load(), [load]);

  if (!can("users.view")) return <Forbidden />;
  const manage = can("users.manage");
  const act = async (fn: () => Promise<unknown>, done: string) => {
    try {
      await fn();
      toast(done);
      await load();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Something went wrong.", true);
    }
  };

  return (
    <>
      <PageHead
        title="Users"
        sub="Invited users get an email with a link to set their password. What each person can do depends on their roles."
        actions={manage && <Button variant="primary" icon="user-plus" onClick={() => setEditing("new")}>Invite user</Button>}
      />
      <div className="cms-card">
        <div className="cms-table__wrap">
          <table className="cms-table">
            <thead>
              <tr><th>Name</th><th>Roles</th><th>Status</th><th>Last sign-in</th>{manage && <th />}</tr>
            </thead>
            <tbody>
              {!users ? (
                <tr><td colSpan={5} className="cms-empty">Loading…</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="cms-strong">{u.name}{u.id === me.id && <span className="cms-muted"> (you)</span>}</div>
                      <div className="cms-muted">{u.email}</div>
                    </td>
                    <td>{u.roles.map((r) => r.name).join(", ") || "—"}</td>
                    <td><span className={`cms-pill ${STATUS[u.status][0]}`}>{STATUS[u.status][1]}</span></td>
                    <td className="cms-muted">{fmtDate(u.lastLoginAt)}</td>
                    {manage && (
                      <td style={{ whiteSpace: "nowrap", textAlign: "right" }}>
                        {u.status === "invited" && (
                          <Button variant="text" size="small" onClick={() => act(() => api(`/api/cms/users/${u.id}/resend-invite`, { method: "POST" }), `Invitation sent again to ${u.email}.`)}>
                            Resend invite
                          </Button>
                        )}
                        <button type="button" className="cms-iconbtn" aria-label={`Edit ${u.name}`} onClick={() => setEditing(u)}>
                          <Icon name="pencil" size={16} />
                        </button>
                        {u.id !== me.id && (
                          <button
                            type="button"
                            className="cms-iconbtn cms-iconbtn--danger"
                            aria-label={`Delete ${u.name}`}
                            onClick={() => confirm(`Delete ${u.name}? They lose access straight away.`) && act(() => api(`/api/cms/users/${u.id}`, { method: "DELETE" }), "User deleted.")}
                          >
                            <Icon name="trash-2" size={16} />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {editing && <UserForm user={editing === "new" ? null : editing} roles={roles} isMe={editing !== "new" && editing.id === me.id} onClose={() => setEditing(null)} onSaved={async (msg, warn) => { setEditing(null); toast(msg, warn); await load(); }} />}
    </>
  );
}

function UserForm({ user, roles, isMe, onClose, onSaved }: { user: User | null; roles: Role[]; isMe: boolean; onClose: () => void; onSaved: (msg: string, warn?: boolean) => void }) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [roleIds, setRoleIds] = useState<number[]>(user?.roles.map((r) => r.id) ?? []);
  const [status, setStatus] = useState(user?.status ?? "invited");
  const [err, setErr] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setErr(null);
    try {
      if (user) {
        await api(`/api/cms/users/${user.id}`, { method: "PATCH", body: { name, roleIds, ...(status !== "invited" && status !== user.status ? { status } : {}) } });
        onSaved("User updated.");
      } else {
        const r = await api<{ emailSent: boolean; emailError?: string }>("/api/cms/users", { body: { name, email, roleIds } });
        if (r.emailSent) onSaved(`Invitation sent to ${email}.`);
        else onSaved(r.emailError ?? "The user was added, but the invitation email couldn't be sent.", true);
      }
    } catch (e) {
      setErr(e instanceof ApiError ? e : new ApiError(0, "Something went wrong."));
      setBusy(false);
    }
  };

  return (
    <Modal
      small
      title={user ? `Edit ${user.name}` : "Invite a user"}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={busy || !name || !roleIds.length || (!user && !email)} onClick={submit}>
            {user ? "Save" : "Send invitation"}
          </Button>
        </>
      }
    >
      {err && <div className="cms-banner" role="alert">{err.message}</div>}
      <Input id="u-name" label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
      <Input id="u-email" label="Email" type="email" required value={email} disabled={!!user} onChange={(e) => setEmail(e.target.value)} />
      {err?.fieldError(["email"]) && <span className="cms-field__error">{err.fieldError(["email"])}</span>}
      <div className="cms-field">
        <span className="cms-field__label">Roles</span>
        {roles.map((r) => (
          <label key={r.id} className="cms-check">
            <input type="checkbox" checked={roleIds.includes(r.id)} onChange={(e) => setRoleIds(e.target.checked ? [...roleIds, r.id] : roleIds.filter((x) => x !== r.id))} />
            <span>
              <span className="cms-strong">{r.name}</span>
              <br />
              <span className="cms-muted">{r.description}</span>
            </span>
          </label>
        ))}
      </div>
      {user && user.status !== "invited" && !isMe && (
        <label className="cms-switch">
          <input type="checkbox" checked={status === "active"} onChange={(e) => setStatus(e.target.checked ? "active" : "disabled")} />
          Account active (turn off to block sign-in)
        </label>
      )}
    </Modal>
  );
}
