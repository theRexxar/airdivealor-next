"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/cms/client";
import { Button, Icon } from "@/components/ui";
import { emptyObject, type BlockKind, type Field, type I18n, type MediaRef } from "@/lib/cms/fields";
import type { ResolvedMedia } from "@/lib/cms/home-types";
import { MediaPicker, type MediaItem } from "./media";
import { RichTextEditor } from "./RichTextEditor";
import { richText } from "@/lib/rich-text";

type Path = (string | number)[];
type Errors = { path: Path; message: string }[];

interface Ctx {
  readOnly: boolean;
  errors: Errors;
  /** Media already resolved by the API, plus files picked in this session. */
  media: Record<string, ResolvedMedia>;
  onMediaPicked: (m: MediaItem) => void;
}

const errAt = (errors: Errors, path: Path) => errors.find((e) => e.path.join(".") === path.join("."))?.message;
const errUnder = (errors: Errors, path: Path) => errors.some((e) => e.path.join(".").startsWith(path.join(".") + "."));

/** Renders a list of fields for an object value. Changes come back through onChange with the whole object. */
export function Fields({ fields, value, onChange, path, ctx }: { fields: Field[]; value: Record<string, unknown>; onChange: (v: Record<string, unknown>) => void; path: Path; ctx: Ctx }) {
  return (
    <div className="cms-fields">
      {fields.map((f) => (
        <FieldInput key={f.key} field={f} value={value?.[f.key]} path={[...path, f.key]} ctx={ctx} onChange={(v) => onChange({ ...value, [f.key]: v })} />
      ))}
    </div>
  );
}

function Label({ field, id }: { field: Field; id?: string }) {
  return (
    <>
      <label className="cms-field__label" htmlFor={id}>
        {field.label}
        {"required" in field && field.required && <span className="tw-field__req" aria-hidden="true">*</span>}
      </label>
      {field.help && <span className="cms-field__help">{field.help}</span>}
    </>
  );
}

function FieldInput({ field: f, value, onChange, path, ctx }: { field: Field; value: unknown; onChange: (v: unknown) => void; path: Path; ctx: Ctx }) {
  const id = path.join("-");
  const error = errAt(ctx.errors, path);
  const wrap = (children: React.ReactNode, labelFor?: string) => (
    <div className="cms-field" data-error={error ? "" : undefined}>
      <Label field={f} id={labelFor} />
      {children}
      {error && <span className="cms-field__error">{error}</span>}
    </div>
  );

  switch (f.type) {
    case "text":
    case "url":
      return wrap(
        <div className="tw-field__control">
          <input id={id} className="tw-field__input" type={f.type === "url" ? "url" : "text"} value={(value as string) ?? ""} readOnly={ctx.readOnly} placeholder={f.type === "text" ? f.placeholder : "https://…"} onChange={(e) => onChange(e.target.value)} />
        </div>,
        id,
      );
    case "textarea":
      return wrap(<textarea id={id} className="cms-textarea" value={(value as string) ?? ""} readOnly={ctx.readOnly} onChange={(e) => onChange(e.target.value)} />, id);
    case "number":
      return wrap(
        <div className="tw-field__control" style={{ maxWidth: 240 }}>
          <input
            id={id}
            className="tw-field__input"
            type="number"
            step={f.step ?? 1}
            min={f.min}
            max={f.max}
            readOnly={ctx.readOnly}
            value={typeof value === "number" && !Number.isNaN(value) ? value : ""}
            onChange={(e) => onChange(e.target.value === "" ? Number.NaN : Number(e.target.value))}
          />
        </div>,
        id,
      );
    case "boolean":
      return (
        <div className="cms-field">
          <label className="cms-switch">
            <input type="checkbox" checked={!!value} disabled={ctx.readOnly} onChange={(e) => onChange(e.target.checked)} />
            {f.label}
          </label>
          {f.help && <span className="cms-field__help">{f.help}</span>}
        </div>
      );
    case "select":
      return wrap(
        <div className="tw-field__control tw-field__control--select" style={{ maxWidth: 360 }}>
          <select id={id} className="tw-field__input tw-field__select" value={(value as string) ?? ""} disabled={ctx.readOnly} onChange={(e) => onChange(e.target.value)}>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <Icon name="chevron-down" size={20} className="tw-field__icon" />
        </div>,
        id,
      );
    case "i18n": {
      const v = (value as I18n) ?? { en: "", id: "" };
      const enErr = errAt(ctx.errors, [...path, "en"]);
      const idErr = errAt(ctx.errors, [...path, "id"]);
      const input = (lang: "en" | "id") =>
        f.multiline ? (
          <textarea id={`${id}-${lang}`} className="cms-textarea" value={v[lang]} readOnly={ctx.readOnly} onChange={(e) => onChange({ ...v, [lang]: e.target.value })} />
        ) : (
          <div className="tw-field__control">
            <input id={`${id}-${lang}`} className="tw-field__input" value={v[lang]} readOnly={ctx.readOnly} onChange={(e) => onChange({ ...v, [lang]: e.target.value })} />
          </div>
        );
      return (
        <div className="cms-field" data-error={enErr || idErr || error ? "" : undefined}>
          <Label field={f} id={`${id}-en`} />
          <div className="cms-i18n">
            <div className="cms-i18n__lang">
              <span className="cms-i18n__tag">EN</span>
              {input("en")}
              {enErr && <span className="cms-field__error">{enErr}</span>}
            </div>
            <div className="cms-i18n__lang">
              <span className="cms-i18n__tag">ID</span>
              {input("id")}
              {idErr && <span className="cms-field__error">{idErr}</span>}
            </div>
          </div>
          {error && <span className="cms-field__error">{error}</span>}
        </div>
      );
    }
    case "richtext": {
      const v = (value as I18n) ?? { en: "", id: "" };
      const enErr = errAt(ctx.errors, [...path, "en"]);
      const idErr = errAt(ctx.errors, [...path, "id"]);
      return (
        <div className="cms-field" data-error={enErr || idErr || error ? "" : undefined}>
          <Label field={f} id={`${id}-en`} />
          <div className="cms-i18n cms-i18n--stacked">
            {(["en", "id"] as const).map((lang) => (
              <div key={lang} className="cms-i18n__lang">
                <span className="cms-i18n__tag">{lang.toUpperCase()}</span>
                <RichTextEditor id={`${id}-${lang}`} lang={lang} value={v[lang] ?? ""} readOnly={ctx.readOnly} onMediaPicked={ctx.onMediaPicked} onChange={(html) => onChange({ ...v, [lang]: html })} />
                {(lang === "en" ? enErr : idErr) && <span className="cms-field__error">{lang === "en" ? enErr : idErr}</span>}
              </div>
            ))}
          </div>
          {error && <span className="cms-field__error">{error}</span>}
        </div>
      );
    }
    case "media":
      return wrap(<MediaInput accept={f.accept} value={(value as MediaRef) ?? { mediaId: null, url: "" }} onChange={onChange} ctx={ctx} />);
    case "group":
      return (
        <div className="cms-group">
          <span className="cms-group__title">{f.label}</span>
          {f.help && <span className="cms-field__help">{f.help}</span>}
          <Fields fields={f.fields} value={(value as Record<string, unknown>) ?? {}} onChange={onChange} path={path} ctx={ctx} />
        </div>
      );
    case "ref":
      return wrap(<RefInput id={id} collection={f.collection} value={(value as string) ?? ""} readOnly={ctx.readOnly} onChange={onChange} />, id);
    case "list":
      return <ListInput field={f} value={(value as Record<string, unknown>[]) ?? []} onChange={onChange} path={path} ctx={ctx} error={error} />;
    case "blocks":
      return <BlocksInput field={f} value={(value as Record<string, unknown>[]) ?? []} onChange={onChange} path={path} ctx={ctx} error={error} />;
    case "date":
      return wrap(
        <div className="tw-field__control" style={{ maxWidth: 240 }}>
          <input id={id} className="tw-field__input" type="date" value={(value as string) ?? ""} readOnly={ctx.readOnly} onChange={(e) => onChange(e.target.value)} />
        </div>,
        id,
      );
  }
}

/** Options per collection, loaded once per page view and shared by every picker. */
const refCache = new Map<string, Promise<{ value: string; label: string }[]>>();
function loadOptions(collection: string) {
  if (!refCache.has(collection)) {
    refCache.set(
      collection,
      api<{ options: { value: string; label: string }[] }>(`/api/cms/collections/${collection}/options`)
        .then((r) => r.options)
        .catch(() => {
          refCache.delete(collection);
          return [];
        }),
    );
  }
  return refCache.get(collection)!;
}

function RefInput({ id, collection, value, readOnly, onChange }: { id: string; collection: string; value: string; readOnly: boolean; onChange: (v: string) => void }) {
  const [options, setOptions] = useState<{ value: string; label: string }[] | null>(null);
  useEffect(() => {
    let live = true;
    loadOptions(collection).then((o) => live && setOptions(o));
    return () => {
      live = false;
    };
  }, [collection]);
  const known = !options || !value || options.some((o) => o.value === value);
  return (
    <div className="tw-field__control tw-field__control--select" style={{ maxWidth: 420 }}>
      <select id={id} className="tw-field__input tw-field__select" value={value} disabled={readOnly || !options} onChange={(e) => onChange(e.target.value)}>
        <option value="">{options ? "Choose…" : "Loading…"}</option>
        {!known && <option value={value}>{value} (deleted)</option>}
        {options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Icon name="chevron-down" size={20} className="tw-field__icon" />
    </div>
  );
}

function itemTitle(f: Extract<Field, { type: "list" }>, item: Record<string, unknown>, i: number) {
  const v = f.titleKey ? item?.[f.titleKey] : undefined;
  const text = typeof v === "string" ? v : v && typeof v === "object" && "en" in v ? (v as I18n).en : "";
  const opt = f.fields.find((x) => x.key === f.titleKey);
  const label = opt?.type === "select" ? opt.options.find((o) => o.value === v)?.label : undefined;
  return label || text || `${f.itemLabel} ${i + 1}`;
}

function ListInput({ field: f, value, onChange, path, ctx, error }: { field: Extract<Field, { type: "list" }>; value: Record<string, unknown>[]; onChange: (v: unknown) => void; path: Path; ctx: Ctx; error?: string }) {
  const [open, setOpen] = useState<number | null>(value.length === 1 ? 0 : null);
  const set = (i: number, v: Record<string, unknown>) => onChange(value.map((x, j) => (j === i ? v : x)));
  const move = (i: number, d: -1 | 1) => {
    const next = [...value];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
    if (open === i) setOpen(i + d);
  };
  const canAdd = !ctx.readOnly && (f.max == null || value.length < f.max);
  const canRemove = !ctx.readOnly && (f.min == null || value.length > f.min);
  return (
    <div className="cms-field" data-error={error ? "" : undefined}>
      <Label field={f} />
      <div className="cms-list">
        {value.map((item, i) => {
          const bad = errUnder(ctx.errors, [...path, i]);
          const isOpen = open === i || bad;
          return (
            <div key={i} className="cms-item" data-error={bad ? "" : undefined}>
              <div className="cms-item__head">
                <button type="button" className="cms-item__toggle" aria-expanded={!!isOpen} onClick={() => setOpen(open === i ? null : i)}>
                  <Icon name={isOpen ? "chevron-down" : "chevron-right"} size={16} />
                  <span className="cms-item__num">{i + 1}</span>
                  <span>{itemTitle(f, item, i)}</span>
                </button>
                {!ctx.readOnly && (
                  <>
                    <button type="button" className="cms-iconbtn" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                      <Icon name="chevron-up" size={16} />
                    </button>
                    <button type="button" className="cms-iconbtn" aria-label="Move down" disabled={i === value.length - 1} onClick={() => move(i, 1)}>
                      <Icon name="chevron-down" size={16} />
                    </button>
                    <button type="button" className="cms-iconbtn" aria-label="Duplicate" disabled={!canAdd} onClick={() => onChange([...value.slice(0, i + 1), structuredClone(item), ...value.slice(i + 1)])}>
                      <Icon name="copy" size={16} />
                    </button>
                    <button
                      type="button"
                      className="cms-iconbtn cms-iconbtn--danger"
                      aria-label={`Remove ${f.itemLabel.toLowerCase()}`}
                      disabled={!canRemove}
                      onClick={() => confirm(`Remove ${itemTitle(f, item, i)}?`) && onChange(value.filter((_, j) => j !== i))}
                    >
                      <Icon name="trash-2" size={16} />
                    </button>
                  </>
                )}
              </div>
              {isOpen && (
                <div className="cms-item__body">
                  <Fields fields={f.fields} value={item} onChange={(v) => set(i, v)} path={[...path, i]} ctx={ctx} />
                </div>
              )}
            </div>
          );
        })}
        {!value.length && <div className="cms-muted">No {f.itemLabel.toLowerCase()}s yet.</div>}
      </div>
      {canAdd && (
        <div>
          <Button
            variant="secondary"
            size="small"
            icon="plus"
            onClick={() => {
              onChange([...value, emptyObject(f.fields)]);
              setOpen(value.length);
            }}
          >
            Add {f.itemLabel.toLowerCase()}
          </Button>
        </div>
      )}
      {error && <span className="cms-field__error">{error}</span>}
    </div>
  );
}

/** Short preview text for a block: its title field, else its first text. */
function blockTitle(k: BlockKind | undefined, item: Record<string, unknown>) {
  if (!k) return "Unknown block";
  const keys = k.titleKey ? [k.titleKey] : k.fields.map((f) => f.key);
  for (const key of keys) {
    const v = item?.[key];
    const raw = typeof v === "string" ? v : v && typeof v === "object" && "en" in v ? (v as I18n).en : "";
    // Rich text: its words, not its HTML.
    const text = k.fields.find((x) => x.key === key)?.type === "richtext" ? richText(raw) : raw;
    if (text) return text.length > 70 ? text.slice(0, 70) + "…" : text;
  }
  return "";
}

/** Mixed blocks (e.g. a story body): like a list, but each item has a kind with its own fields. */
function BlocksInput({ field: f, value, onChange, path, ctx, error }: { field: Extract<Field, { type: "blocks" }>; value: Record<string, unknown>[]; onChange: (v: unknown) => void; path: Path; ctx: Ctx; error?: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const [kind, setKind] = useState(f.kinds[0]?.type ?? "");
  const kindOf = (item: Record<string, unknown>) => f.kinds.find((k) => k.type === item?.type);
  const set = (i: number, v: Record<string, unknown>) => onChange(value.map((x, j) => (j === i ? { ...v, type: x.type } : x)));
  const move = (i: number, d: -1 | 1) => {
    const next = [...value];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
    if (open === i) setOpen(i + d);
  };
  const canAdd = !ctx.readOnly && (f.max == null || value.length < f.max);
  const add = () => {
    const k = f.kinds.find((x) => x.type === kind);
    if (!k) return;
    onChange([...value, { type: k.type, ...emptyObject(k.fields) }]);
    setOpen(value.length);
  };
  return (
    <div className="cms-field" data-error={error ? "" : undefined}>
      <Label field={f} />
      <div className="cms-list">
        {value.map((item, i) => {
          const k = kindOf(item);
          const bad = errUnder(ctx.errors, [...path, i]);
          const isOpen = open === i || bad;
          const title = blockTitle(k, item);
          return (
            <div key={i} className="cms-item" data-error={bad ? "" : undefined}>
              <div className="cms-item__head">
                <button type="button" className="cms-item__toggle" aria-expanded={!!isOpen} onClick={() => setOpen(open === i ? null : i)}>
                  <Icon name={isOpen ? "chevron-down" : "chevron-right"} size={16} />
                  <span className="cms-item__num">{i + 1}</span>
                  <span>
                    <strong>{k?.label ?? String(item?.type)}</strong>
                    {title && <span className="cms-muted"> · {title}</span>}
                  </span>
                </button>
                {!ctx.readOnly && (
                  <>
                    <button type="button" className="cms-iconbtn" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                      <Icon name="chevron-up" size={16} />
                    </button>
                    <button type="button" className="cms-iconbtn" aria-label="Move down" disabled={i === value.length - 1} onClick={() => move(i, 1)}>
                      <Icon name="chevron-down" size={16} />
                    </button>
                    <button type="button" className="cms-iconbtn" aria-label="Duplicate" disabled={!canAdd} onClick={() => onChange([...value.slice(0, i + 1), structuredClone(item), ...value.slice(i + 1)])}>
                      <Icon name="copy" size={16} />
                    </button>
                    <button type="button" className="cms-iconbtn cms-iconbtn--danger" aria-label="Remove block" onClick={() => confirm(`Remove this ${(k?.label ?? "block").toLowerCase()}?`) && onChange(value.filter((_, j) => j !== i))}>
                      <Icon name="trash-2" size={16} />
                    </button>
                  </>
                )}
              </div>
              {isOpen && k && (
                <div className="cms-item__body">
                  <Fields fields={k.fields} value={item} onChange={(v) => set(i, v)} path={[...path, i]} ctx={ctx} />
                </div>
              )}
            </div>
          );
        })}
        {!value.length && <div className="cms-muted">Nothing here yet.</div>}
      </div>
      {canAdd && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div className="tw-field__control tw-field__control--select" style={{ maxWidth: 220 }}>
            <select aria-label="Block type" className="tw-field__input tw-field__select" value={kind} onChange={(e) => setKind(e.target.value)}>
              {f.kinds.map((k) => (
                <option key={k.type} value={k.type}>
                  {k.label}
                </option>
              ))}
            </select>
            <Icon name="chevron-down" size={20} className="tw-field__icon" />
          </div>
          <Button variant="secondary" size="small" icon="plus" onClick={add}>
            Add block
          </Button>
        </div>
      )}
      {error && <span className="cms-field__error">{error}</span>}
    </div>
  );
}

function MediaInput({ accept, value, onChange, ctx }: { accept: "image" | "video"; value: MediaRef; onChange: (v: MediaRef) => void; ctx: Ctx }) {
  const [picking, setPicking] = useState(false);
  const [showUrl, setShowUrl] = useState(!value.mediaId && !!value.url);
  const resolved = value.mediaId ? ctx.media[value.mediaId] : null;
  const src = resolved ? (accept === "video" ? resolved.poster ?? "" : resolved.url) : value.url;
  return (
    <div className="cms-media-field">
      <div className="cms-media-thumb">
        {src ? (
          accept === "video" && !resolved ? <video src={src} muted /> : <img src={src} alt="" />
        ) : (
          <Icon name={accept === "video" ? "video" : "image"} size={28} />
        )}
      </div>
      <div className="cms-media-field__side">
        <span className="cms-media-field__name">
          {value.mediaId ? `Media library #${value.mediaId}${resolved ? "" : " (processing or missing)"}` : value.url ? `External: ${value.url}` : "Nothing selected"}
        </span>
        {!ctx.readOnly && (
          <div className="cms-actions">
            <Button variant="secondary" size="small" icon="images" onClick={() => setPicking(true)}>
              {value.mediaId || value.url ? "Replace" : "Choose"}
            </Button>
            <Button variant="text" size="small" onClick={() => setShowUrl((s) => !s)}>
              {showUrl ? "Hide URL" : "Use a URL"}
            </Button>
            {(value.mediaId || value.url) && (
              <Button variant="text" size="small" onClick={() => onChange({ mediaId: null, url: "" })}>
                Remove
              </Button>
            )}
          </div>
        )}
        {showUrl && !ctx.readOnly && (
          <div className="tw-field__control">
            <input className="tw-field__input" placeholder="https://… or /path/on/site.jpg" value={value.mediaId ? "" : value.url} onChange={(e) => onChange({ mediaId: null, url: e.target.value })} aria-label="External URL" />
          </div>
        )}
      </div>
      {picking && (
        <MediaPicker
          accept={accept}
          selectedId={value.mediaId}
          onClose={() => setPicking(false)}
          onChoose={(m) => {
            ctx.onMediaPicked(m);
            onChange({ mediaId: m.id, url: "" });
            setShowUrl(false);
            setPicking(false);
          }}
        />
      )}
    </div>
  );
}
