"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCmsUser } from "@/components/cms/CmsUser";
import { Fields } from "@/components/cms/FieldEditor";
import { PageHead } from "@/components/cms/Shell";
import { useToast } from "@/components/cms/Toast";
import type { MediaItem } from "@/components/cms/media";
import { Alert, Button, ButtonLink } from "@/components/ui";
import { api, ApiError, fmtDate } from "@/lib/cms/client";
import { emptyObject } from "@/lib/cms/fields";
import type { ResolvedMedia } from "@/lib/cms/home-types";
import { collectionDef, itemTitle } from "@/lib/cms/registry";
import { COLLECTION_SECTION, itemPath, type PageCollection } from "@/lib/i18n-routes";
import { Forbidden } from "../../../Forbidden";

type Status = "draft" | "live" | "changed" | "hidden";

interface ItemData {
  id: number;
  draft: Record<string, unknown>;
  published: Record<string, unknown> | null;
  status: Status;
  enabled: boolean;
  draftUpdatedAt: string | null;
  publishedAt: string | null;
  media: Record<string, ResolvedMedia>;
  can: { edit: boolean; publish: boolean; delete: boolean };
}

const PILL: Record<Status, [string, string]> = {
  live: ["cms-pill--live", "Live"],
  changed: ["cms-pill--draft", "Unpublished changes"],
  draft: ["cms-pill--off", "Not published"],
  hidden: ["cms-pill--off", "Hidden"],
};

const asResolved = (m: MediaItem): ResolvedMedia => ({ url: m.url ?? "", srcSet: "", poster: m.posterUrl ?? undefined, alt: m.alt, width: m.width ?? undefined, height: m.height ?? undefined });

/** Edit one collection item (a dive site guide), or create a new one when the id is "new". */
export default function ItemEditorPage() {
  const { key, id } = useParams<{ key: string; id: string }>();
  const isNew = id === "new";
  const def = collectionDef(key);
  const { can } = useCmsUser();
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState<ItemData | null>(null);
  const [value, setValue] = useState<Record<string, unknown> | null>(null);
  const [media, setMedia] = useState<Record<string, ResolvedMedia>>({});
  const [errors, setErrors] = useState<{ path: (string | number)[]; message: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const canEdit = can(`${key}.edit`);
  const canPublish = can(`${key}.publish`);

  const load = useCallback(async () => {
    if (!def) return;
    if (isNew) {
      const blank = emptyObject(def.fields);
      setData({ id: 0, draft: blank, published: null, status: "draft", enabled: true, draftUpdatedAt: null, publishedAt: null, media: {}, can: { edit: canEdit, publish: canPublish, delete: false } });
      setValue(blank);
      return;
    }
    try {
      const d = await api<ItemData>(`/api/cms/collections/${key}/${id}`);
      const draft = { ...emptyObject(def.fields), ...d.draft };
      setData({ ...d, draft });
      setValue(draft);
      setMedia(d.media);
      setErrors([]);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setNotFound(true);
      else toast(e instanceof ApiError ? e.message : "Could not load this item.", true);
    }
  }, [def, isNew, key, id, canEdit, canPublish, toast]);
  useEffect(() => void load(), [load]);

  const dirty = useMemo(() => !!data && JSON.stringify(value) !== JSON.stringify(data.draft), [value, data]);

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  if (!def || notFound) return <div className="cms-card"><div className="cms-empty">This item doesn't exist.</div></div>;
  if (!can(`${key}.view`) || (isNew && !canEdit)) return <Forbidden />;
  if (!data || !value) return <div className="cms-card"><div className="cms-empty">Loading…</div></div>;

  const readOnly = !data.can.edit;
  const title = isNew ? `New ${def.itemLabel}` : (itemTitle(def, value) || itemTitle(def, data.draft) || def.itemLabel);
  const liveSlug = (data.published?.slug as string | undefined) ?? null;
  const hasChanges = data.status === "changed" || data.status === "draft";
  const base = `/api/cms/collections/${key}/${id}`;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      if (e instanceof ApiError) {
        setErrors(e.details.map((d) => ({ ...d, path: d.path[0] === "content" ? d.path.slice(1) : d.path })));
        toast(e.message, true);
      } else toast("Something went wrong.", true);
    } finally {
      setBusy(false);
    }
  };
  /** Save the draft; for a new item this creates it and returns its id. */
  const saveDraft = async (): Promise<number> => {
    if (isNew) {
      const r = await api<{ id: number }>(`/api/cms/collections/${key}`, { body: { content: value } });
      return r.id;
    }
    await api(base, { method: "PUT", body: { content: value } });
    return data.id;
  };
  const save = () =>
    run(async () => {
      const newId = await saveDraft();
      setErrors([]);
      toast(isNew ? `Draft created. It isn't on the website until you publish.` : "Draft saved. It isn't live until you publish.");
      if (isNew) {
        setData((d) => d && { ...d, draft: value });
        router.replace(`/cms/collections/${key}/${newId}`);
      } else await load();
    });
  const publish = () =>
    run(async () => {
      const newId = dirty || isNew ? await saveDraft() : data.id;
      await api(`/api/cms/collections/${key}/${newId}/publish`, { method: "POST" });
      setErrors([]);
      toast(`“${title}” is live.`);
      if (isNew) {
        setData((d) => d && { ...d, draft: value });
        router.replace(`/cms/collections/${key}/${newId}`);
      } else await load();
    });
  const unpublish = () =>
    confirm(`Take “${title}” off the website? It stays here as a draft.`) &&
    run(async () => {
      await api(`${base}/unpublish`, { method: "POST" });
      toast("Taken off the website.");
      await load();
    });
  const toggleVisible = () =>
    run(async () => {
      await api(`${base}/visibility`, { method: "PUT", body: { enabled: !data.enabled } });
      toast(data.enabled ? "Hidden from the website." : "Shown on the website.");
      await load();
    });
  const discard = () =>
    confirm("Discard all unpublished changes? The item goes back to the live version.") &&
    run(async () => {
      await api(`${base}/discard`, { method: "POST" });
      toast("Changes discarded.");
      await load();
    });
  const remove = () =>
    confirm(`Delete “${title}” for good? This can't be undone.`) &&
    run(async () => {
      await api(base, { method: "DELETE" });
      toast("Deleted.");
      router.push(`/cms/collections/${key}`);
    });

  return (
    <>
      <PageHead
        crumbs={[{ label: "Content" }, { href: `/cms/collections/${key}`, label: def.label }, { label: title }]}
        title={title}
        sub={isNew ? `Fill in the guide, then save a draft or publish it. New ${def.itemLabel}s go to the end of the list.` : undefined}
        actions={
          !isNew && !def.noItemPage && (
            <>
              <ButtonLink href={`/cms/preview/${key}/${data.id}`} external variant="secondary" icon="eye">
                Preview
              </ButtonLink>
              {liveSlug && data.status !== "hidden" && (
                <ButtonLink href={def.itemHref(liveSlug)} external variant="text" icon="external-link">
                  View live
                </ButtonLink>
              )}
            </>
          )
        }
      />
      <div className="cms-editor">
        <div className="cms-card">
          <div className="cms-card__body">
            {readOnly && (
              <div style={{ marginBottom: 20 }}>
                <Alert>You can view this {def.itemLabel} but not edit it.</Alert>
              </div>
            )}
            <Fields fields={def.fields} value={value} onChange={setValue} path={[]} ctx={{ readOnly, errors, media, onMediaPicked: (m) => setMedia((cur) => ({ ...cur, [m.id]: asResolved(m) })) }} />
          </div>
        </div>
        <aside className="cms-editor__side">
          <div className="cms-card">
            <div className="cms-card__head">
              <span className="cms-card__title">Status</span>
              {dirty ? <span className="cms-pill cms-pill--draft">Not saved</span> : <span className={`cms-pill ${PILL[data.status][0]}`}>{PILL[data.status][1]}</span>}
            </div>
            <div className="cms-card__body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {!isNew && (
                <div className="cms-muted">
                  Draft saved: {fmtDate(data.draftUpdatedAt)}
                  <br />
                  Published: {fmtDate(data.publishedAt)}
                  {!data.enabled && (
                    <>
                      <br />
                      Hidden: the guide page and its card are off the website.
                    </>
                  )}
                </div>
              )}
              {!readOnly && (
                <Button variant="secondary" disabled={busy || (!dirty && !isNew)} onClick={save}>
                  {isNew ? "Save draft" : "Save draft"}
                </Button>
              )}
              {data.can.publish && (
                <Button variant="primary" icon="send" disabled={busy || (!dirty && !isNew && !hasChanges)} onClick={publish}>
                  {dirty || isNew ? "Save and publish" : "Publish"}
                </Button>
              )}
              {!readOnly && !isNew && data.published && data.status === "changed" && !dirty && (
                <Button variant="text" disabled={busy} onClick={discard}>
                  Discard changes
                </Button>
              )}
              {dirty && (
                <Button variant="text" disabled={busy} onClick={() => setValue(data.draft)}>
                  Undo unsaved edits
                </Button>
              )}
              {errors.length > 0 && <div className="cms-field__error">{errors.length} field{errors.length === 1 ? "" : "s"} need attention.</div>}
            </div>
          </div>
          {!isNew && (data.can.publish || data.can.delete) && (
            <div className="cms-card">
              <div className="cms-card__head">
                <span className="cms-card__title">On the website</span>
              </div>
              <div className="cms-card__body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {data.can.publish && (
                  <Button variant="secondary" icon={data.enabled ? "eye-off" : "eye"} disabled={busy} onClick={toggleVisible}>
                    {data.enabled ? "Hide from website" : "Show on website"}
                  </Button>
                )}
                {data.can.publish && data.published && (
                  <Button variant="text" disabled={busy} onClick={unpublish}>
                    Unpublish
                  </Button>
                )}
                {data.can.delete && (
                  <Button variant="text" icon="trash-2" disabled={busy} onClick={remove}>
                    Delete {def.itemLabel}
                  </Button>
                )}
              </div>
            </div>
          )}
          <div className="cms-card">
            <div className="cms-card__body cms-muted">
              {!def.noItemPage && key in COLLECTION_SECTION && (
                <>
                  The web addresses become the page links: {itemPath("en", key as PageCollection, { slug: String(value.slug || "web-address") })} in English and{" "}
                  {itemPath("id", key as PageCollection, { slug: String(value.slug || "web-address"), slugId: String(value.slugId || "") })} in Indonesian (the English address when the Indonesian one is empty).{" "}
                </>
              )}Text fields have English (EN) and Indonesian (ID) boxes.
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
