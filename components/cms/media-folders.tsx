"use client";

import { useState } from "react";
import { Button, Icon, Input, Select } from "@/components/ui";
import { api, ApiError } from "@/lib/cms/client";
import { Modal } from "./Modal";
import { useToast } from "./Toast";

/** A folder as GET /api/cms/media/folders returns it. */
export interface Folder {
  id: number;
  name: string;
  parentId: number | null;
  files: number;
  totalFiles: number;
  subfolders: number;
  path: string[];
}
export interface FolderTree {
  folders: Folder[];
  rootFiles: number;
  total: number;
  can: { manage: boolean; move: boolean };
}

export const ROOT_LABEL = "Media library";
export const MAX_DEPTH = 5;
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
export const folderPathLabel = (f: Folder | undefined | null) => (f ? `${ROOT_LABEL} / ${f.path.join(" / ")}` : ROOT_LABEL);

/** "Media library › Dive sites › Pura", each part clickable. */
export function FolderCrumbs({ tree, current, onOpen }: { tree: FolderTree; current: number | null; onOpen: (id: number | null) => void }) {
  const chain: Folder[] = [];
  for (let f = tree.folders.find((x) => x.id === current); f; f = tree.folders.find((x) => x.id === f!.parentId)) chain.unshift(f);
  return (
    <nav aria-label="Folder" className="cms-folder-crumbs">
      <button type="button" onClick={() => onOpen(null)} aria-current={current === null ? "page" : undefined}>
        <Icon name="images" size={16} />
        {ROOT_LABEL}
      </button>
      {chain.map((f) => (
        <span key={f.id} style={{ display: "contents" }}>
          <Icon name="chevron-right" size={14} />
          <button type="button" onClick={() => onOpen(f.id)} aria-current={f.id === current ? "page" : undefined}>
            {f.name}
          </button>
        </span>
      ))}
    </nav>
  );
}

/** The whole folder structure, with file counts; the open folder is highlighted. */
export function FolderTreeNav({ tree, current, onOpen }: { tree: FolderTree; current: number | null; onOpen: (id: number | null) => void }) {
  const kids = (id: number | null) => tree.folders.filter((f) => f.parentId === id);
  const branch = (id: number | null, depth: number): React.ReactNode =>
    kids(id).map((f) => (
      <li key={f.id}>
        <button type="button" className="cms-folder-tree__item" style={{ paddingLeft: 8 + depth * 14 }} aria-current={f.id === current ? "page" : undefined} onClick={() => onOpen(f.id)}>
          <Icon name={f.id === current ? "folder-open" : "folder"} size={16} />
          <span className="cms-folder-tree__name">{f.name}</span>
          <span className="cms-folder-tree__count">{f.totalFiles}</span>
        </button>
        {kids(f.id).length > 0 && <ul>{branch(f.id, depth + 1)}</ul>}
      </li>
    ));
  return (
    <nav aria-label="Folders" className="cms-folder-tree">
      <ul>
        <li>
          <button type="button" className="cms-folder-tree__item" aria-current={current === null ? "page" : undefined} onClick={() => onOpen(null)}>
            <Icon name="images" size={16} />
            <span className="cms-folder-tree__name">{ROOT_LABEL}</span>
            <span className="cms-folder-tree__count">{tree.rootFiles}</span>
          </button>
          {kids(null).length > 0 && <ul>{branch(null, 1)}</ul>}
        </li>
      </ul>
    </nav>
  );
}

/** Subfolders of the open folder, as tiles above the files. */
export function FolderTiles({ folders, onOpen }: { folders: Folder[]; onOpen: (id: number) => void }) {
  if (!folders.length) return null;
  return (
    <div className="cms-folder-tiles">
      {folders.map((f) => (
        <button key={f.id} type="button" className="cms-folder-tile" onClick={() => onOpen(f.id)} aria-label={`Open folder ${f.name}`}>
          <Icon name="folder" size={22} />
          <span className="cms-folder-tile__text">
            <span className="cms-folder-tile__name">{f.name}</span>
            <span className="cms-folder-tile__meta">
              {plural(f.totalFiles, "file")}
              {f.subfolders > 0 && ` · ${plural(f.subfolders, "folder")}`}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

/** Folders a folder (or files) can go into, as "Media library / A / B", in tree order. */
export function folderOptions(tree: FolderTree, exclude?: Folder) {
  const blocked = new Set<number>();
  if (exclude) {
    const stack = [exclude.id];
    while (stack.length) {
      const id = stack.pop()!;
      blocked.add(id);
      tree.folders.filter((f) => f.parentId === id).forEach((f) => stack.push(f.id));
    }
  }
  return [
    { value: "", label: ROOT_LABEL },
    ...tree.folders
      .filter((f) => !blocked.has(f.id) && (!exclude || f.path.length + 1 + depthBelow(tree, exclude) <= MAX_DEPTH))
      .map((f) => ({ value: String(f.id), label: folderPathLabel(f) })),
  ];
}
function depthBelow(tree: FolderTree, f: Folder): number {
  return Math.max(0, ...tree.folders.filter((x) => x.parentId === f.id).map((x) => 1 + depthBelow(tree, x)));
}

/** Busy state and API errors for a dialog. */
function useRun() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Something went wrong.";
      setError(msg);
      toast(msg, true);
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run };
}

/** Create a folder inside `parent`, or rename `folder`. Explains what the change does before it's made. */
export function FolderNameDialog({ mode, folder, parent, onClose, onDone }: { mode: "create" | "rename"; folder?: Folder; parent: Folder | null; onClose: () => void; onDone: (id: number) => void }) {
  const toast = useToast();
  const { busy, error, run } = useRun();
  const [name, setName] = useState(mode === "rename" ? (folder?.name ?? "") : "");
  const where = folderPathLabel(parent);
  const submit = () =>
    run(async () => {
      if (mode === "create") {
        const r = await api<{ folder: { id: number } }>("/api/cms/media/folders", { body: { name, parentId: parent?.id ?? null } });
        toast(`Folder “${name.trim()}” created.`);
        onDone(r.folder.id);
      } else {
        await api(`/api/cms/media/folders/${folder!.id}`, { method: "PATCH", body: { name } });
        toast(`Renamed to “${name.trim()}”.`);
        onDone(folder!.id);
      }
    });
  const unchanged = mode === "rename" && name.trim() === folder?.name;
  return (
    <Modal
      small
      title={mode === "create" ? "New folder" : `Rename “${folder?.name}”`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={busy || !name.trim() || unchanged} onClick={submit}>
            {mode === "create" ? "Create folder" : "Rename folder"}
          </Button>
        </>
      }
    >
      <form
        className="cms-fields"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim() && !unchanged) submit();
        }}
      >
        <Input id="folder-name" label="Folder name" autoFocus maxLength={80} value={name} onChange={(e) => setName(e.target.value)} error={error || undefined} placeholder="e.g. Dive sites" />
        {mode === "create" ? (
          <p className="cms-muted" style={{ margin: 0 }}>
            The folder is created in <strong>{where}</strong>. Folders only organise the library; files keep their web addresses wherever they are.
          </p>
        ) : (
          <div className="cms-banner">
            Renaming changes the folder structure for everyone who uses the media library. The {plural(folder?.totalFiles ?? 0, "file")} inside keep their web addresses, so pages that use them don't change.
          </div>
        )}
      </form>
    </Modal>
  );
}

/** Move a folder (with everything in it) or a set of files into another folder. */
export function MoveDialog({ tree, folder, files, current, onClose, onDone }: { tree: FolderTree; folder?: Folder; files?: number[]; current: number | null; onClose: () => void; onDone: (to: number | null) => void }) {
  const toast = useToast();
  const { busy, error, run } = useRun();
  const options = folderOptions(tree, folder);
  const startAt = folder ? folder.parentId : current;
  const [to, setTo] = useState(startAt ? String(startAt) : "");
  const target = to ? Number(to) : null;
  const targetLabel = folderPathLabel(tree.folders.find((f) => f.id === target));
  const submit = () =>
    run(async () => {
      if (folder) {
        await api(`/api/cms/media/folders/${folder.id}`, { method: "PATCH", body: { parentId: target } });
        toast(`“${folder.name}” moved to ${targetLabel}.`);
      } else {
        await api("/api/cms/media/move", { body: { ids: files, folderId: target } });
        toast(`${plural(files!.length, "file")} moved to ${targetLabel}.`);
      }
      onDone(target);
    });
  return (
    <Modal
      small
      title={folder ? `Move “${folder.name}”` : `Move ${plural(files?.length ?? 0, "file")}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" icon="folder-input" disabled={busy || target === startAt} onClick={submit}>
            Move here
          </Button>
        </>
      }
    >
      <div className="cms-fields">
        <Select id="move-to" label="Move to" value={to} onChange={(e) => setTo(e.target.value)} options={options} />
        {error && <div className="cms-field__error">{error}</div>}
        {folder ? (
          <div className="cms-banner">
            This changes the folder structure: “{folder.name}” moves with its {plural(folder.subfolders, "subfolder")} and {plural(folder.totalFiles, "file")} into <strong>{targetLabel}</strong>. Files keep their web addresses, so pages that use them don't change.
          </div>
        ) : (
          <p className="cms-muted" style={{ margin: 0 }}>
            Files keep their web addresses when they move, so pages that use them don't change.
          </p>
        )}
      </div>
    </Modal>
  );
}

/** Delete a folder after the user types its name: explains that subfolders go too and files move to the top. */
export function DeleteFolderDialog({ folder, onClose, onDone }: { folder: Folder; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const { busy, error, run } = useRun();
  const [typed, setTyped] = useState("");
  const matches = typed.trim().toLowerCase() === folder.name.toLowerCase();
  const submit = () =>
    run(async () => {
      const r = await api<{ subfolders: number; movedFiles: number }>(`/api/cms/media/folders/${folder.id}`, { method: "DELETE" });
      toast(`Folder “${folder.name}” deleted. ${r.movedFiles ? `${plural(r.movedFiles, "file")} moved to ${ROOT_LABEL}.` : "It had no files."}`);
      onDone();
    });
  return (
    <Modal
      small
      title={`Delete folder “${folder.name}”?`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" icon="trash-2" disabled={busy || !matches} onClick={submit}>
            Delete folder
          </Button>
        </>
      }
    >
      <form
        className="cms-fields"
        onSubmit={(e) => {
          e.preventDefault();
          if (matches) submit();
        }}
      >
        <div className="cms-banner cms-banner--danger">
          <strong>This changes the structure of the media library.</strong>
          <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
            <li>
              The folder <strong>{folderPathLabel(folder)}</strong>
              {folder.subfolders > 0 ? <> and its {plural(folder.subfolders, "subfolder")} are deleted.</> : " is deleted."}
            </li>
            <li>
              {folder.totalFiles > 0 ? (
                <>
                  Its {plural(folder.totalFiles, "file")} {folder.totalFiles === 1 ? "is" : "are"} <strong>not deleted</strong>: {folder.totalFiles === 1 ? "it moves" : "they move"} to the top of the library ({ROOT_LABEL}).
                </>
              ) : (
                "It has no files."
              )}
            </li>
            <li>Pages that use these files don't change. The folder can't be brought back; you would have to create it again and move the files.</li>
          </ul>
        </div>
        <Input id="delete-confirm" label={`Type the folder name (${folder.name}) to confirm`} autoFocus autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} error={error || undefined} />
      </form>
    </Modal>
  );
}
