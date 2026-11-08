"use client";

import { useItemHref } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { LangSwitch } from "@/components/LangSwitch";
import { useEffect } from "react";
import { Alert, ButtonLink, Eyebrow, Icon, Tag, asIcon, type IconName } from "@/components/ui";
import { bookMessage, type PublishedCourse } from "@/lib/cms/courses-types";
import { useContent } from "@/lib/cms/use-content";
import { ROUTES, waLink } from "@/lib/site";
import "../courses.css";

const pad = (n: number) => String(n).padStart(2, "0");

/** One course page, rendered from the CMS (published, or the draft in the CMS preview). */
export function CourseDetailView({ data }: { data: PublishedCourse }) {
  const itemHref = useItemHref();
  const { L, img, t } = useContent(data.media);
  const c = data.course;
  const d = data.detail;
  const i = data.index;
  const N = data.total;
  const book = waLink(bookMessage(d.bookMessage, c));
  const name = L(c.name);

  const router = useRouter();
  // Escape goes back to the course list, like closing the prototype's detail view.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && router.push(ROUTES.courses);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  useEffect(() => {
    document.title = `${name} | Air Dive Alor`;
  }, [name]);

  const stats = (
    [
      { icon: "calendar-days", label: "Duration", value: L(c.days) },
      { icon: "waves", label: "Dives", value: L(c.diveCount) },
      { icon: "arrow-down-to-line", label: "Max depth", value: L(c.depth) },
      { icon: "user", label: "Minimum age", value: L(c.age) },
    ] as { icon: IconName; label: string; value: string }[]
  ).filter((s) => s.value);
  const reqs = (
    [
      { icon: "badge-check", label: "Prerequisite", value: L(c.prereq) },
      { icon: "user", label: "Minimum age", value: L(c.age) },
      { icon: "stethoscope", label: "Medical", value: L(d.medical) },
      { icon: "shield-check", label: "Insurance", value: L(d.insurance) },
      { icon: "plane", label: "Flying after", value: L(d.flying) },
    ] as { icon: IconName; label: string; value: string }[]
  ).filter((r) => r.value);
  const hero = img(c.photo);

  return (
    <div data-theme="dark" className="page course-detail">
      <div className="course-bar">
        <ButtonLink href={ROUTES.courses} variant="text" icon="arrow-left">
          {t("Back to courses")}
        </ButtonLink>
        <span className="course-bar__count">
          {pad(i + 1)} / {pad(N)}
        </span>
        <LangSwitch />
        <ButtonLink href={itemHref("courses", data.prev)} variant="secondary" icon="arrow-left" iconOnly aria-label={t("Previous course")} />
        <ButtonLink href={itemHref("courses", data.next)} variant="secondary" icon="arrow-right" iconOnly aria-label={t("Next course")} />
        {L(d.bookLabel) && (
          <span className="wide-only">
            <ButtonLink href={book} external variant="primary" icon="message-circle">
              {L(d.bookLabel)}
            </ButtonLink>
          </span>
        )}
      </div>

      <section className="cd-hero">
        {hero && <img className="cd-hero__img" src={hero.src} srcSet={hero.srcSet} sizes={hero.sizes} alt={hero.alt || name} fetchPriority="high" />}
        <div aria-hidden="true" className="cd-hero__shade" />
        <div className="cd-hero__body">
          <Eyebrow onDark>{`${t("Course")} · ${pad(i + 1)} · ${t(c.level)}`}</Eyebrow>
          <h1 className="cd-hero__title">{name}</h1>
          <p className="cd-hero__lead">{L(c.text)}</p>
          <div className="cd-hero__price">
            <span className="cd-hero__amount">{c.price}</span>
            <span className="cd-hero__stay">{L(c.stay) ? `${L(c.stay)} · ${t("per person")}` : t("per person")}</span>
          </div>
        </div>
      </section>

      {stats.length > 0 && (
        <section className="cd-section">
          <SectionHead eyebrow="01 · At a glance" title="The course in four numbers." />
          <div className="cd-stats">
            {stats.map((st) => (
              <div key={st.label} className="cd-card">
                <Icon name={st.icon} size={24} style={{ color: "var(--primary-300)" }} />
                <span className="cd-caps">{t(st.label)}</span>
                <span className="cd-stats__value">{st.value}</span>
              </div>
            ))}
          </div>
          <div className="cd-cert">
            <div className="cd-cert__agency">
              <span>{t("Certification")}</span>
              <Tag tone="primary" icon="badge-check">
                {c.agency}
              </Tag>
            </div>
            {L(c.group) && <span className="cd-cert__group">{L(c.group)}</span>}
          </div>
        </section>
      )}

      {(c.included.length > 0 || d.notIncluded.length > 0) && (
        <section className="cd-section cd-section--alt">
          <div className="cd-split">
            <div className="cd-split__narrow">
              <SectionHead eyebrow="02 · What's included" title="One price. Everything you need." inline />
              {L(d.includedLead) && <p className="cd-lead">{L(d.includedLead)}</p>}
              {d.notIncluded.length > 0 && (
                <div className="cd-list">
                  <span className="cd-caps cd-list__head">{t("Not included")}</span>
                  {d.notIncluded.map((ni, k) => (
                    <div key={k} className="cd-list__row">
                      <Icon name="circle-x" size={18} style={{ color: "var(--text-secondary)", flex: "none" }} />
                      <span>{L(ni.text)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="cd-split__wide cd-incl">
              {c.included.map((it, k) => (
                <div key={k} className="cd-card cd-card--plain">
                  <Icon name={asIcon(it.icon)} size={24} style={{ color: "var(--primary-300)" }} />
                  <span className="cd-incl__title">{L(it.title)}</span>
                  <span className="cd-incl__text">{L(it.text)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {(c.learn.length > 0 || c.plan.length > 0) && (
        <section className="cd-section">
          <div className="cd-split">
            <div className="cd-split__narrow">
              <SectionHead eyebrow="03 · What you'll learn" title="Skills you take home." inline />
              <div className="cd-learn">
                {c.learn.map((ln, k) => (
                  <div key={k} className="cd-learn__row">
                    <span className="cd-learn__n">{pad(k + 1)}</span>
                    <span className="cd-learn__t">{L(ln.text)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="cd-split__wide cd-plan">
              {c.plan.length > 0 && <span className="cd-caps">{t("Course plan")}</span>}
              {c.plan.map((p, k) => (
                <div key={k} className="cd-plan__row">
                  <span className="cd-plan__day">{L(p.day)}</span>
                  <div className="cd-plan__text">
                    <span className="cd-plan__title">{L(p.title)}</span>
                    <span className="cd-plan__desc">{L(p.text)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="cd-section">
        <SectionHead eyebrow="04 · Requirements and safety" title="Before you sign up." />
        <div className="cd-split cd-split--reqs">
          <div className="cd-split__wide cd-reqs">
            {reqs.map((rq) => (
              <div key={rq.label} className="cd-reqs__row">
                <Icon name={rq.icon} size={20} style={{ color: "var(--primary-300)" }} />
                <span className="cd-reqs__label">{t(rq.label)}</span>
                <span className="cd-reqs__value">{rq.value}</span>
              </div>
            ))}
          </div>
          <div className="cd-split__narrow cd-side">
            {c.tips.length > 0 && (
              <div className="cd-card cd-tips">
                <span className="cd-caps">{t("Instructor tips")}</span>
                {c.tips.map((tp, k) => (
                  <div key={k} className="cd-tips__row">
                    <Icon name="circle-check" size={20} style={{ color: "var(--primary-300)", flex: "none" }} />
                    <span>{L(tp.text)}</span>
                  </div>
                ))}
              </div>
            )}
            {L(d.reqNote) && (
              <div data-theme="light">
                <Alert>{L(d.reqNote)}</Alert>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="cd-section cd-section--alt cd-cta">
        <div className="cd-cta__text">
          <h3 className="cd-cta__title">{L(d.ctaTitle)}</h3>
          {L(d.ctaText) && <p className="cd-lead">{L(d.ctaText)}</p>}
        </div>
        <div className="cta-band__actions">
          {L(d.ctaLabel) && (
            <ButtonLink href={book} external variant="primary" size="xlarge" icon="message-circle">
              {L(d.ctaLabel)}
            </ButtonLink>
          )}
          <ButtonLink href={itemHref("courses", data.next)} variant="secondary" size="xlarge" icon="arrow-right" iconPosition="suffix">
            {L(data.next.name)}
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}

function SectionHead({ eyebrow, title, inline }: { eyebrow: string; title: string; inline?: boolean }) {
  const { t } = useContent({});
  return (
    <div className={inline ? "cd-head cd-head--inline" : "cd-head"}>
      <Eyebrow onDark>{t(eyebrow)}</Eyebrow>
      <h2 className="cd-head__title">{t(title)}</h2>
    </div>
  );
}
