import Link from "@/components/LocalLink";
import type React from "react";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

import { LUCIDE, type IconName } from "@/lib/lucide";

export type { IconName };

export function Icon({ name, size = 24, style, className }: { name: IconName; size?: number; style?: CSSProperties; className?: string }) {
  const cp = LUCIDE[name];
  if (cp == null) return null;
  return (
    <i className={className ? `tw-icon ${className}` : "tw-icon"} style={{ fontSize: size, width: size, height: size, ...style }} aria-hidden="true">
      {String.fromCodePoint(cp)}
    </i>
  );
}

type Size = "xlarge" | "large" | "medium" | "small" | "xsmall";
const BTN_ICON: Record<Size, number> = { xlarge: 20, large: 20, medium: 18, small: 18, xsmall: 16 };

interface BtnOwn {
  variant?: "primary" | "secondary" | "text";
  size?: Size;
  icon?: IconName;
  iconPosition?: "prefix" | "suffix";
  /** Round icon-only button. Pass an aria-label. */
  iconOnly?: boolean;
  children?: ReactNode;
}

function btnParts({ variant = "primary", size = "medium", icon, iconPosition = "prefix", iconOnly, children }: BtnOwn) {
  const className = ["tw-btn", `tw-btn--${variant}`, `tw-btn--${size}`, iconOnly && "tw-btn--icon tw-btn--rounded"].filter(Boolean).join(" ");
  const ic = icon ? <Icon name={icon} size={BTN_ICON[size]} /> : null;
  const content = (
    <>
      {iconPosition === "prefix" && ic}
      {!iconOnly && <span className="tw-btn__label">{children}</span>}
      {iconPosition === "suffix" && ic}
    </>
  );
  return { className, content };
}

export function Button({ variant, size, icon, iconPosition, iconOnly, children, ...rest }: BtnOwn & ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className, content } = btnParts({ variant, size, icon, iconPosition, iconOnly, children });
  return (
    <button type="button" className={className} {...rest}>
      {content}
    </button>
  );
}

/** A link that looks like a design-system button. External links open in a new tab. */
export function ButtonLink({ variant, size, icon, iconPosition, iconOnly, children, href, external, ...rest }: BtnOwn & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; external?: boolean }) {
  const { className, content } = btnParts({ variant, size, icon, iconPosition, iconOnly, children });
  if (external)
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} {...rest}>
        {content}
      </a>
    );
  return (
    <Link href={href} className={className} {...rest}>
      {content}
    </Link>
  );
}

export function Eyebrow({ children, onDark }: { children: ReactNode; onDark?: boolean }) {
  return (
    <div className={onDark ? "eyebrow eyebrow--on-dark" : "eyebrow"}>
      <span className="eyebrow__rule" />
      {children}
    </div>
  );
}

export const Dot = ({ light }: { light?: boolean }) => <span aria-hidden="true" className={light ? "dot dot--light" : "dot"} />;

/** Design-system Avatar: initials in a neutral circle. */
export function Avatar({ name, size = 38 }: { name: string; size?: number }) {
  const initials = name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span className="tw-avatar" style={{ width: size, height: size }}>
      <span className="tw-avatar__initials" aria-label={name} style={{ fontSize: Math.round(size * 0.375) }}>
        {initials}
      </span>
    </span>
  );
}

/** Narrow a data string to an icon name (unknown names render nothing). */
export const asIcon = (name: string) => name as IconName;

export function Tag({ children, icon, tone = "grey" }: { children: ReactNode; icon?: IconName; tone?: "grey" | "primary" }) {
  return (
    <span className={`tw-tag tw-tag--${tone}`}>
      {icon && <Icon name={icon} size={12} />}
      <span className="tw-tag__label">{children}</span>
    </span>
  );
}

export function Alert({ children, type = "info", description }: { children: ReactNode; type?: "info" | "success" | "error"; description?: ReactNode }) {
  return (
    <div className={`tw-alert tw-alert--${type}`} role={type === "error" ? "alert" : "status"}>
      <span className="tw-alert__icon">
        <Icon name={type === "success" ? "circle-check" : type === "error" ? "circle-alert" : "info"} size={20} />
      </span>
      <div className="tw-alert__body">
        <div className={description ? "tw-alert__title tw-alert__title--strong" : "tw-alert__title"}>{children}</div>
        {description && <div className="tw-alert__desc">{description}</div>}
      </div>
    </div>
  );
}

const STAR =
  "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z";

/** Design-system star rating (supports partial stars). */
export function Rating({ value, max = 5, size = 16 }: { value: number; max?: number; size?: number }) {
  return (
    <span className="tw-rating" role="img" aria-label={`${value} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        const gid = `tw-star-${i}-${Math.round(fill * 100)}`;
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
            {fill > 0 && fill < 1 && (
              <defs>
                <clipPath id={gid}>
                  <rect x={0} y={0} width={24 * fill} height={24} />
                </clipPath>
              </defs>
            )}
            <path d={STAR} className="tw-rating__empty" />
            {fill > 0 && <path d={STAR} className="tw-rating__full" clipPath={fill < 1 ? `url(#${gid})` : undefined} />}
          </svg>
        );
      })}
    </span>
  );
}

export function AvatarWithText({ name, meta, size = 38 }: { name: string; meta?: ReactNode; size?: number }) {
  return (
    <div className="tw-avatar-text">
      <Avatar name={name} size={size} />
      <div className="tw-avatar-text__body">
        <div className="tw-avatar-text__name">{name}</div>
        {meta && <div className="tw-avatar-text__meta">{meta}</div>}
      </div>
    </div>
  );
}

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  /** Shown after the label, e.g. "(optional)". */
  labelNote?: string;
  /** Help under the field. */
  hint?: string;
  /** Error under the field; marks it invalid. */
  error?: string;
}

/** Label, control, hint and error, wired up for screen readers. */
function Field({ id, label, required, labelNote, hint, error, children }: FieldProps & { children: (describedBy: string | undefined) => ReactNode }) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="tw-field" data-error={error ? "" : undefined}>
      <label className="tw-field__label" htmlFor={id}>
        {label}
        {required && <span className="tw-field__req" aria-hidden="true">*</span>}
        {labelNote && <span className="tw-field__note"> {labelNote}</span>}
      </label>
      {children(describedBy)}
      {hint && !error && (
        <span id={`${id}-hint`} className="tw-field__hint">
          {hint}
        </span>
      )}
      {error && (
        <span id={`${id}-error`} className="tw-field__error">
          {error}
        </span>
      )}
    </div>
  );
}

export function Input({ id, label, required, labelNote, hint, error, ...rest }: FieldProps & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field id={id} label={label} required={required} labelNote={labelNote} hint={hint} error={error}>
      {(describedBy) => (
        <div className="tw-field__control">
          <input id={id} className="tw-field__input" required={required} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...rest} />
        </div>
      )}
    </Field>
  );
}

export function Textarea({ id, label, required, labelNote, hint, error, ...rest }: FieldProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Field id={id} label={label} required={required} labelNote={labelNote} hint={hint} error={error}>
      {(describedBy) => (
        <div className="tw-field__control tw-field__control--area">
          <textarea id={id} className="tw-field__input tw-field__textarea" required={required} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...rest} />
        </div>
      )}
    </Field>
  );
}

export function Select({ id, label, required, options, ...rest }: FieldProps & { options: { value: string; label: string }[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="tw-field">
      <label className="tw-field__label" htmlFor={id}>
        {label}
        {required && <span className="tw-field__req" aria-hidden="true">*</span>}
      </label>
      <div className="tw-field__control tw-field__control--select">
        <select id={id} className="tw-field__input tw-field__select" required={required} {...rest}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Icon name="chevron-down" size={20} className="tw-field__icon" />
      </div>
    </div>
  );
}
