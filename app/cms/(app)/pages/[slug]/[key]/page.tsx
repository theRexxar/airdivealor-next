"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Fields } from "@/components/cms/FieldEditor";
import { PageHead } from "@/components/cms/Shell";
import { useToast } from "@/components/cms/Toast";
import { Alert, Button, ButtonLink } from "@/components/ui";
import { api, ApiError, fmtDate } from "@/lib/cms/client";
import { emptyObject } from "@/lib/cms/fields";
import { pageDef, sectionDefOf } from "@/lib/cms/registry";
import type { ResolvedMedia } from "@/lib/cms/home-types";
import type { MediaItem } from "@/components/cms/media";

interface SectionData {
  key: string;
  draft: Record<string, unknown>;
  published: Record<string, unknown> | null;
  hasChanges: boolean;
  enabled: boolean;
  draftUpdatedAt: string | null;
  publishedAt: string | null;
  media: Record<string, ResolvedMedia>;
  canEdit: boolean;
  canPublish: boolean;
}

/** Turn a picked library file into the resolved shape the field previews use. */
const asResolved = (m: MediaItem): ResolvedMedia => ({ url: m.url ?? "", srcSet: "", poster: m.posterUrl ?? undefined, alt: m.alt, width: m.width ?? undefined, height: m.height ?? undefined });

export default function SectionEditorPage() {
  const { slug, key } = useParams<{ slug: string; key: string }>();
  const def = sectionDefOf(slug, key);
  const page = pageDef(slug);
  const toast = useToast();
  const [data, setData] = useState<SectionData | null>(null);
  const [value, setValue] = useState<Record<string, unknown> | null>(null);
  const [media, setMedia] = useState<Record<string, ResolvedMedia>>({});
  const [errors, setErrors] = useState<{ path: (string | number)[]; message: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api<SectionData>(`/api/cms/pages/${slug}/sections/${key}`);
      const draft = def ? { ...emptyObject(def.fields), ...d.draft } : d.draft;
      setData({ ...d, draft });
      setValue(draft);
      setMedia(d.media);
      setErrors([]);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setNotFound(true);
      else toast(e instanceof ApiError ? e.message : "Could not load the section.", true);
    }
  }, [slug, key, toast]);
  useEffect(() => void load(), [load]);

  const dirty = useMemo(() => !!data && JSON.stringify(value) !== JSON.stringify(data.draft), [value, data]);

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  if (notFound || !def || !page) return <div className="cms-card"><div className="cms-empty">This section doesn't exist.</div></div>;
  if (!data || !value) return <div className="cms-card"><div className="cms-empty">Loading…</div></div>;

  const readOnly = !data.canEdit;
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
  const save = () =>
    run(async () => {
      await api(`/api/cms/pages/${slug}/sections/${key}`, { method: "PUT", body: { content: value } });
      toast("Draft saved. It isn't live until you publish.");
      await load();
    });
  const publish = () =>
    run(async () => {
      if (dirty) await api(`/api/cms/pages/${slug}/sections/${key}`, { method: "PUT", body: { content: value } });
      await api(`/api/cms/pages/${slug}/publish`, { body: { keys: [key] } });
      toast(`“${def.label}” is live.`);
      await load();
    });
  const discard = () =>
    confirm("Discard all unpublished changes in this section? It goes back to the live version.") &&
    run(async () => {
      await api(`/api/cms/pages/${slug}/sections/${key}/discard`, { method: "POST" });
      toast("Changes discarded.");
      await load();
    });

  return (
    <>
      <PageHead
        crumbs={[{ label: "Pages" }, { href: `/cms/pages/${slug}`, label: page.label }, { label: def.label }]}
        title={def.label}
        sub={def.description}
        actions={
          <ButtonLink href={`/cms/preview/${slug}#${key}`} external variant="secondary" icon="eye">
            Preview
          </ButtonLink>
        }
      />
      <div className="cms-editor">
        <div className="cms-card">
          <div className="cms-card__body">
            {readOnly && (
              <div style={{ marginBottom: 20 }}>
                <Alert>You can view this section but not edit it.</Alert>
              </div>
            )}
            <Fields fields={def.fields} value={value} onChange={setValue} path={[]} ctx={{ readOnly, errors, media, onMediaPicked: (m) => setMedia((cur) => ({ ...cur, [m.id]: asResolved(m) })) }} />
          </div>
        </div>
        <aside className="cms-editor__side">
          <div className="cms-card">
            <div className="cms-card__head">
              <span className="cms-card__title">Status</span>
              {dirty ? <span className="cms-pill cms-pill--draft">Not saved</span> : data.hasChanges ? <span className="cms-pill cms-pill--draft">Draft</span> : <span className="cms-pill cms-pill--live">Live</span>}
            </div>
            <div className="cms-card__body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="cms-muted">
                Draft saved: {fmtDate(data.draftUpdatedAt)}
                <br />
                Published: {fmtDate(data.publishedAt)}
                {!data.enabled && (
                  <>
                    <br />
                    This section is hidden on the live page.
                  </>
                )}
              </div>
              {!readOnly && (
                <Button variant="secondary" disabled={busy || !dirty} onClick={save}>
                  Save draft
                </Button>
              )}
              {data.canPublish && (
                <Button variant="primary" icon="send" disabled={busy || (!dirty && !data.hasChanges)} onClick={publish}>
                  {dirty ? "Save and publish" : "Publish"}
                </Button>
              )}
              {!readOnly && data.hasChanges && !dirty && (
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
          <div className="cms-card">
            <div className="cms-card__body cms-muted">Text fields have English (EN) and Indonesian (ID) boxes. Visitors see the one that matches the language switch.</div>
          </div>
        </aside>
      </div>
    </>
  );
}
