"use client";

import { useItemHref } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { LangSwitch } from "@/components/LangSwitch";
import { useEffect } from "react";
import { Alert, ButtonLink, Eyebrow, Icon, Tag, type IconName } from "@/components/ui";
import type { PublishedSite } from "@/lib/cms/dive-sites-types";
import { useContent } from "@/lib/cms/use-content";
import { ROUTES, waLink } from "@/lib/site";
import { siteNum } from "@/lib/sites";
import "../sites.css";
import "../../dive-courses/courses.css";

/** One dive site guide, rendered from the CMS (published, or the draft in the CMS preview). */
export function SiteGuideView({ data }: { data: PublishedSite }) {
  const itemHref = useItemHref();
  const { L, img, t } = useContent(data.media);
  const router = useRouter();
  const x = data.site;
  const g = data.guide;
  const book = waLink((g.bookMessage || "Hi Air Dive Alor, I would like to dive {site}.").replace(/\{site\}/g, x.name));

  // Escape goes back to the list, like closing the prototype's guide overlay.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && router.push(ROUTES.diveSites);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  const stats = (
    [
      { icon: "arrow-down-to-line", label: "Depth", value: x.depth },
      { icon: "wind", label: "Current", value: L(x.current) },
      { icon: "eye", label: "Visibility", value: x.vis },
      { icon: "thermometer", label: "Water temp", value: x.temp },
    ] as { icon: IconName; label: string; value: string }[]
  ).filter((s) => s.value);
  const access = (
    [
      { icon: "ship", label: "Boat time", value: L(x.boatTime) },
      { icon: "anchor", label: "Entry", value: L(x.entry) },
      { icon: "badge-check", label: "Minimum level", value: L(x.minLevel) },
      { icon: "triangle-alert", label: "Watch for", value: L(x.hazards) },
      { icon: "clock", label: "Best time", value: L(x.bestTime) },
    ] as { icon: IconName; label: string; value: string }[]
  ).filter((s) => s.value);
  const hero = img(x.photo);
  const gallery = x.gallery.map((p) => img(p.photo, "(min-width: 900px) 30vw, 100vw")).filter((p): p is NonNullable<typeof p> => !!p);
  const hasStats = stats.length > 0 || !!L(x.level);
  const hasTopo = !!(L(x.topo) || L(x.aboutTopo));
  const hasLife = !!(x.see.length || L(x.aboutLife) || gallery.length);
  const hasAccess = access.length > 0 || x.tips.length > 0;

  return (
    <div data-theme="dark" className="page course-detail">
      <div className="course-bar">
        <ButtonLink href={ROUTES.diveSites} variant="text" icon="arrow-left">
          {t("All dive sites")}
        </ButtonLink>
        <span className="course-bar__count">
          {data.index + 1} / {data.total}
        </span>
        <LangSwitch />
        <ButtonLink href={itemHref("sites", data.prev)} variant="secondary" icon="arrow-left" iconOnly aria-label={t("Previous site")} />
        <ButtonLink href={itemHref("sites", data.next)} variant="secondary" icon="arrow-right" iconOnly aria-label={t("Next site")} />
        <span className="guide-wide-only">
          <ButtonLink href={book} external variant="primary">
            {L(g.bookLabel)}
          </ButtonLink>
        </span>
      </div>

      <section className="cd-hero">
        {hero && <img className="cd-hero__img" src={hero.src} srcSet={hero.srcSet} sizes={hero.sizes} alt={hero.alt || `${x.name} photo`} fetchPriority="high" style={{ background: "var(--neutral-800)" }} />}
        <div aria-hidden="true" className="cd-hero__shade" />
        <div className="cd-hero__body">
          <Eyebrow onDark>{`${t("Site guide")} · ${siteNum(data.index)} · ${L(x.type)}`}</Eyebrow>
          <h1 className="cd-hero__title">{x.name}</h1>
          {x.aka && (
            <div className="guide-aka">
              <span>{t("Also known as")}</span>: {x.aka}
            </div>
          )}
          <p className="cd-hero__lead">{L(x.intro)}</p>
          <div className="guide-loc">
            <Icon name="map-pin" size={18} style={{ color: "var(--primary-300)" }} />
            <span>{t("Location")}</span> · {L(x.area) || "Alor"}
          </div>
          {x.unverified && L(g.draftNote) && (
            <div className="guide-draft">
              <Icon name="info" size={16} style={{ color: "var(--primary-300)" }} />
              <span>{L(g.draftNote)}</span>
            </div>
          )}
          {x.credit && (
            <div className="guide-draft" style={{ fontSize: 12 }}>
              {t("Photo")}:{" "}
              {x.creditUrl ? (
                <a href={x.creditUrl} target="_blank" rel="noopener noreferrer">
                  {x.credit}
                </a>
              ) : (
                x.credit
              )}
            </div>
          )}
        </div>
      </section>

      {hasStats && (
        <section className="cd-section">
          <Head eyebrow="01 · Site conditions" title="Conditions on a normal day." />
          <div className="cd-stats">
            {stats.map((st) => (
              <div key={st.label} className="cd-card">
                <Icon name={st.icon} size={24} style={{ color: "var(--primary-300)" }} />
                <span className="cd-caps">{t(st.label)}</span>
                <span className="guide-stat">{st.value}</span>
              </div>
            ))}
          </div>
          <div className="cd-cert">
            <div className="cd-cert__agency">
              <span>{t("Recommended level")}</span>
              <Tag tone="primary" icon="badge-check">
                {L(x.level) || t("Ask us")}
              </Tag>
            </div>
            {L(g.typicalNote) && <span className="cd-cert__group">{L(g.typicalNote)}</span>}
          </div>
        </section>
      )}

      {hasTopo && (
        <section className="cd-section">
          <div className="cd-split">
            <div className="cd-split__narrow guide-gap16">
              <Head eyebrow="02 · Topography and dive type" title="What the reef looks like." inline />
            </div>
            <div className="cd-split__wide guide-topo">
              {L(x.topo) && <p className="guide-topo__lead">{L(x.topo)}</p>}
              {x.diveTypes.length > 0 && (
                <div className="guide-types">
                  <span className="cd-caps">{t("Dive type")}</span>
                  {x.diveTypes.map((dt, k) => (
                    <Tag key={k} icon="waves">
                      {L(dt.label)}
                    </Tag>
                  ))}
                </div>
              )}
              {L(x.aboutTopo) && <p className="cd-lead">{L(x.aboutTopo)}</p>}
            </div>
          </div>
        </section>
      )}

      {hasLife && (
        <section className="cd-section cd-section--alt">
          <div className="cd-split">
            <div className="cd-split__narrow">
              <Head eyebrow="03 · Marine life" title="What lives here." inline />
              {L(x.aboutLife) && <p className="cd-lead">{L(x.aboutLife)}</p>}
              {x.see.length > 0 && (
                <div className="cd-list">
                  <span className="cd-caps cd-list__head">{t("Look out for")}</span>
                  {x.see.map((sp, k) => (
                    <div key={k} className="cd-list__row">
                      <span className="cd-learn__n">{siteNum(k)}</span>
                      <span className="guide-see">{L(sp.name)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="cd-split__wide guide-gallery">
              {gallery.map((p, k) => (
                <div key={k} className="guide-gallery__item">
                  <img src={p.src} srcSet={p.srcSet} sizes={p.sizes} alt={p.alt || `${x.name} photo ${k + 1}`} loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {hasAccess && (
        <section className="cd-section">
          <Head eyebrow="04 · Access and safety" title="Getting there and staying safe." />
          <div className="cd-split cd-split--reqs">
            <div className="cd-split__wide cd-reqs">
              {access.map((ac) => (
                <div key={ac.label} className="cd-reqs__row">
                  <Icon name={ac.icon} size={20} style={{ color: "var(--primary-300)" }} />
                  <span className="cd-reqs__label">{t(ac.label)}</span>
                  <span className="cd-reqs__value">{ac.value}</span>
                </div>
              ))}
            </div>
            <div className="cd-split__narrow cd-side">
              {x.tips.length > 0 && (
                <div className="cd-card cd-tips">
                  <span className="cd-caps">{t("Guide tips")}</span>
                  {x.tips.map((tp, k) => (
                    <div key={k} className="cd-tips__row">
                      <Icon name="circle-check" size={20} style={{ color: "var(--primary-300)", flex: "none" }} />
                      <span>{L(tp.text)}</span>
                    </div>
                  ))}
                </div>
              )}
              {L(g.safetyNote) && (
                <div data-theme="light">
                  <Alert>{L(g.safetyNote)}</Alert>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="cd-section cd-section--alt cd-cta">
        <div className="cd-cta__text">
          <h3 className="cd-cta__title">{L(g.ctaTitle)}</h3>
          {L(g.ctaText) && <p className="cd-lead">{L(g.ctaText)}</p>}
        </div>
        <div className="cta-band__actions">
          <ButtonLink href={book} external variant="primary" size="xlarge">
            {L(g.bookLabel)}
          </ButtonLink>
          <ButtonLink href={itemHref("sites", data.next)} variant="secondary" size="xlarge" icon="arrow-right" iconPosition="suffix">
            {data.next.name}
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}

function Head({ eyebrow, title, inline }: { eyebrow: string; title: string; inline?: boolean }) {
  const { t } = useContent({});
  return (
    <div className={inline ? "cd-head cd-head--inline" : "cd-head"}>
      <Eyebrow onDark>{t(eyebrow)}</Eyebrow>
      <h2 className="cd-head__title">{t(title)}</h2>
    </div>
  );
}
