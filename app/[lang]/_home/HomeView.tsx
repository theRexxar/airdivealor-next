"use client";

import { useItemHref } from "@/lib/i18n";
import { useRef, useState } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Alert, AvatarWithText, Button, ButtonLink, Eyebrow, Icon, Input, Rating, Select, Tag, asIcon } from "@/components/ui";
import type { I18n } from "@/lib/cms/fields";
import type { HomeContent, PublishedHome } from "@/lib/cms/home-types";
import { useContent, type ContentHelpers } from "@/lib/cms/use-content";
import { waLink } from "@/lib/site";
import type { SiteContent } from "@/lib/cms/dive-sites-types";
import { DepthGauge, type GaugeStop } from "./DepthGauge";
import { Preloader } from "./Preloader";
import "./home.css";

const DIVERS = ["1 diver", "2 divers", "3 divers", "4 divers", "5 divers", "6 divers"];
const CERTS = ["Not certified yet", "Open Water", "Advanced", "Rescue or higher", "Dive professional"];
const SECTION_IDS: Record<string, string> = { prices: "b-prices", why: "b-why", sites: "b-sites", stay: "b-stay", reviews: "b-reviews", faq: "b-faq", book: "b-book" };
const DEPTHS: Record<string, number> = { prices: 5, why: 10, sites: 15, stay: 18, reviews: 21, faq: 27, book: 30 };

const scrollToId = (id: string) => {
  const el = document.getElementById(id);
  if (el) window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - 64, behavior: "smooth" });
};

function useHomeContent(data: PublishedHome) {
  return useContent(data.media);
}
type Helpers = ContentHelpers;

/** The Home page, rendered from CMS content (published, or drafts in the CMS preview). */
export function HomeView({ data }: { data: PublishedHome }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const h = useHomeContent(data);
  const c = data.content;
  const pkgIds = c.prices.packages.map((p) => p.id);
  const [pkg, setPkg] = useState(pkgIds.includes("stay") ? "stay" : pkgIds[0] ?? "");
  const [step, setStep] = useState(1);
  const [sent, setSent] = useState(false);
  const [cur, setCur] = useState<"IDR" | "USD">("IDR");

  const choose = (id: string) => {
    setPkg(id);
    setStep(2);
    setSent(false);
    scrollToId("b-book");
  };

  const stops: GaugeStop[] = [
    { depth: 0, id: null, label: "Surface", info: h.L(c.hero.title).replace(/\n/g, " ") },
    ...data.order.filter((k) => k in DEPTHS).map((k) => ({ depth: DEPTHS[k], id: SECTION_IDS[k], label: gaugeLabel(k, c, h), info: h.L((c[k] as { title?: I18n }).title) })),
  ];
  const booking = { pkg, setPkg, step, setStep, sent, setSent, cur, setCur, choose };

  return (
    <>
      <Preloader />
      <div ref={rootRef} className="page home">
        <DepthGauge rootRef={rootRef} stops={stops} />
        <SiteHeader current="home" />
        <Hero c={c} h={h} showAwards={data.order.includes("awards")} bookVisible={data.order.includes("book")} pricesVisible={data.order.includes("prices")} />
        {data.order.map((k) => {
          switch (k) {
            case "prices":
              return <Prices key={k} c={c} h={h} b={booking} awardsAbove={data.order.includes("awards")} />;
            case "why":
              return <Why key={k} c={c} h={h} />;
            case "sites":
              return <Sites key={k} c={c} h={h} sites={data.sites} />;
            case "stay":
              return <Stay key={k} c={c} h={h} />;
            case "reviews":
              return <Reviews key={k} c={c} h={h} />;
            case "faq":
              return <Faq key={k} c={c} h={h} pages={data.faqPages ?? {}} />;
            case "book":
              return <Book key={k} c={c} h={h} b={booking} />;
            default:
              return null; // hero and awards are rendered at the top
          }
        })}
        <SiteFooter />
      </div>
    </>
  );
}

/** Gauge label: the eyebrow after its "·", e.g. "5 m · Prices" → "Prices". */
function gaugeLabel(k: string, c: HomeContent, h: Helpers) {
  const eyebrow = h.L((c[k as keyof HomeContent] as { eyebrow?: I18n }).eyebrow);
  return eyebrow.includes("·") ? eyebrow.split("·").pop()!.trim() : eyebrow || k;
}

type Booking = { pkg: string; setPkg: (v: string) => void; step: number; setStep: (n: number) => void; sent: boolean; setSent: (b: boolean) => void; cur: "IDR" | "USD"; setCur: (c: "IDR" | "USD") => void; choose: (id: string) => void };

function useMoney(c: HomeContent, cur: "IDR" | "USD") {
  const rp = (n: number) => "Rp " + n.toLocaleString("id-ID");
  const usd = (n: number) => "US$" + Math.round(n / (c.prices.usdRate || 1)).toLocaleString("en-US");
  return { main: (n: number) => (cur === "IDR" ? rp(n) : usd(n)), alt: (n: number) => (cur === "IDR" ? "≈ " + usd(n) : rp(n)) };
}

function Hero({ c, h, showAwards, bookVisible, pricesVisible }: { c: HomeContent; h: Helpers; showAwards: boolean; bookVisible: boolean; pricesVisible: boolean }) {
  const { L, img } = h;
  const photo = img(c.hero.image);
  const video = img(c.hero.video);
  const lines = L(c.hero.title).split("\n");
  return (
    <section data-theme="dark" className="home-hero" style={showAwards ? undefined : { marginBottom: 0 }}>
      <div className="home-hero__frame">
        {video ? (
          <video className="home-hero__img" src={video.src} poster={video.poster ?? photo?.src} autoPlay muted loop playsInline aria-hidden="true" />
        ) : (
          photo && <img className="home-hero__img" src={photo.src} srcSet={photo.srcSet} sizes={photo.sizes} alt={photo.alt} fetchPriority="high" />
        )}
        <div aria-hidden="true" className="home-hero__shade" />
        <div className="home-hero__body">
          {L(c.hero.eyebrow) && <Eyebrow onDark>{L(c.hero.eyebrow)}</Eyebrow>}
          <h1 className="home-hero__title">
            {lines.map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {line}
              </span>
            ))}
          </h1>
          {L(c.hero.lead) && <p className="home-hero__lead">{L(c.hero.lead)}</p>}
          <div className="home-hero__ctas">
            {bookVisible && (
              <Button variant="primary" size="xlarge" onClick={() => scrollToId("b-book")}>
                {L(c.hero.primaryCta)}
              </Button>
            )}
            {pricesVisible && L(c.hero.secondaryCta) && (
              <Button variant="text" size="xlarge" icon="arrow-down" iconPosition="suffix" onClick={() => scrollToId("b-prices")}>
                {L(c.hero.secondaryCta)}
              </Button>
            )}
          </div>
        </div>
        {c.hero.caption && <div className="home-hero__caption">{c.hero.caption}</div>}
      </div>
      {showAwards && (
        <div data-theme="light" className="home-awards">
          {c.awards.items.map((a, i) => (
            <div key={i} className="home-awards__item">
              {a.icon === "rating" ? <Rating value={a.rating} /> : <Icon name={asIcon(a.icon)} size={28} style={{ color: "var(--icon-primary)" }} />}
              <div className="home-awards__text">
                <span className="home-awards__title">{L(a.title)}</span>
                {L(a.subtitle) && <span className="home-awards__sub">{L(a.subtitle)}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Prices({ c, h, b, awardsAbove }: { c: HomeContent; h: Helpers; b: Booking; awardsAbove: boolean }) {
  const { L } = h;
  const p = c.prices;
  const { main, alt } = useMoney(c, b.cur);
  return (
    <section id="b-prices" className="home-prices" style={awardsAbove ? undefined : { paddingTop: "clamp(64px, 8.3vw, 120px)" }}>
      <div className="home-head">
        <div className="home-head__text">
          {L(p.eyebrow) && <Eyebrow>{L(p.eyebrow)}</Eyebrow>}
          <h2 className="h2">{L(p.title)}</h2>
          {L(p.lead) && <p className="home-head__lead">{L(p.lead)}</p>}
        </div>
        <div className="home-cur">
          <div className="home-cur__switch">
            <Button variant={b.cur === "IDR" ? "primary" : "text"} size="xsmall" onClick={() => b.setCur("IDR")}>
              IDR
            </Button>
            <Button variant={b.cur === "USD" ? "primary" : "text"} size="xsmall" onClick={() => b.setCur("USD")}>
              USD
            </Button>
          </div>
          {L(p.usdNote) && <div className="home-cur__note">{L(p.usdNote)}</div>}
        </div>
      </div>
      <div className="price-table">
        <div className="price-table__inner" style={{ minWidth: 180 + p.packages.length * 233 }}>
          <div className="price-table__row price-table__row--head" style={{ gridTemplateColumns: `minmax(180px, 300px) repeat(${p.packages.length}, minmax(0, 1fr))` }}>
            <div className="price-table__label price-table__label--head">
              <div className="label-caps">{L(p.tableLabel)}</div>
              <div className="price-table__deposit">{L(p.depositNote)}</div>
            </div>
            {p.packages.map((x) => (
              <div key={x.id} className="price-table__pkg" data-on={x.id === b.pkg || undefined}>
                <div className="price-table__top">
                  {x.highlight && L(x.tag) && <Tag tone="primary">{L(x.tag)}</Tag>}
                  <div className="label-caps price-table__meta">{L(x.meta)}</div>
                </div>
                <h3 className="price-table__name">{L(x.name)}</h3>
                <div className="price-table__price">
                  <div className="price-table__main">{main(x.priceIdr)}</div>
                  <div className="price-table__alt">
                    {alt(x.priceIdr)}
                    {L(x.unit) && ` · ${L(x.unit)}`}
                  </div>
                </div>
                <Button variant={x.id === b.pkg ? "primary" : "secondary"} size="large" style={{ width: "100%" }} onClick={() => b.choose(x.id)}>
                  {L(p.chooseLabel)}
                </Button>
              </div>
            ))}
          </div>
          {p.rows.map((row, r) => (
            <div key={r} className="price-table__row price-table__row--line" style={{ gridTemplateColumns: `minmax(180px, 300px) repeat(${p.packages.length}, minmax(0, 1fr))` }}>
              <div className="price-table__label">{L(row.label)}</div>
              {p.packages.map((x) => {
                const v = x.cells[r]?.value;
                const raw = (v?.en ?? "").trim().toLowerCase();
                return (
                  <div key={x.id} className="price-table__cell" data-on={x.id === b.pkg || undefined}>
                    {raw === "yes" ? (
                      <>
                        <Icon name="check" size={20} style={{ color: "var(--icon-primary)" }} />
                        <span className="visually-hidden">{h.t("Included")}</span>
                      </>
                    ) : raw === "no" || raw === "" ? (
                      <>
                        <Icon name="minus" size={20} style={{ color: "var(--icon-tertiary)" }} />
                        <span className="visually-hidden">{h.t("Not included")}</span>
                      </>
                    ) : (
                      <span className="price-table__num">{L(v)}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Why({ c, h }: { c: HomeContent; h: Helpers }) {
  const { L, img } = h;
  const [i, setI] = useState(0);
  const items = c.why.items;
  const cur = items[Math.min(i, items.length - 1)];
  const photo = img(cur?.photo);
  return (
    <section id="b-why" className="home-why">
      {photo && <img className="home-why__img" src={photo.src} srcSet={photo.srcSet} sizes={photo.sizes} alt="" />}
      <div aria-hidden="true" className="home-why__shade" />
      <div className="home-why__body">
        <div className="home-why__head">
          {L(c.why.eyebrow) && <Eyebrow>{L(c.why.eyebrow)}</Eyebrow>}
          <h2 className="h2">{L(c.why.title)}</h2>
        </div>
        <div className="home-why__list">
          {items.map((w, j) => (
            <button key={j} type="button" className="home-why__item" data-on={j === i || undefined} onClick={() => setI(j)} onMouseEnter={() => setI(j)}>
              <span className="home-why__num">0{j + 1}</span>
              <span className="home-why__text">
                <span className="home-why__label">{L(w.label)}</span>
                {j === i && L(w.text) && <span className="home-why__desc">{L(w.text)}</span>}
              </span>
            </button>
          ))}
        </div>
      </div>
      {cur && L(cur.photoTitle) && <div className="home-why__tag">{L(cur.photoTitle)}</div>}
    </section>
  );
}

/** Site picker: the sites chosen in the CMS, with details from the Dive site guides. Unpublished sites are skipped. */
function Sites({ c, h, sites }: { c: HomeContent; h: Helpers; sites: Record<string, SiteContent> }) {
  const itemHref = useItemHref();
  const { L, img, t } = h;
  const items = c.sites.items.map((x) => ({ ...x, site: sites[x.slug] })).filter((x) => x.site);
  const [i, setI] = useState(Math.max(0, Math.min(items.length - 1, (c.sites.defaultIndex || 1) - 1)));
  const sel = items[i];
  if (!sel?.site) return null;
  const s = sel.site;
  const photo = img(sel.photo, "(min-width: 900px) 50vw, 100vw") ?? img(s.photo, "(min-width: 900px) 50vw, 100vw");
  return (
    <section id="b-sites" data-theme="dark" className="section home-sites">
      <div className="section-intro home-sites__intro">
        {L(c.sites.eyebrow) && <Eyebrow onDark>{L(c.sites.eyebrow)}</Eyebrow>}
        <h2 className="h2">{L(c.sites.title)}</h2>
      </div>
      <div className="home-sites__split">
        <div className="home-sites__list">
          {items.map((x, j) => (
            <button key={x.slug} type="button" className="home-sites__item" data-on={j === i || undefined} onClick={() => setI(j)}>
              <span className="home-sites__num">{String(j + 1).padStart(2, "0")}</span>
              <span className="home-sites__name">{x.site!.name}</span>
              <span className="home-sites__depth">{x.site!.depth}</span>
            </button>
          ))}
        </div>
        <div className="home-sites__detail">
          <div className="home-sites__photo">{photo && <img src={photo.src} srcSet={photo.srcSet} sizes={photo.sizes} alt={photo.alt || `${s.name} photo`} />}</div>
          <div className="home-sites__title">
            <div className="home-sites__titletext">
              <div className="home-sites__type">{L(s.type)}</div>
              <h3 className="home-sites__h3">{s.name}</h3>
            </div>
            <ButtonLink href={itemHref("sites", s)} variant="text" size="large" icon="arrow-right" iconPosition="suffix">
              {L(c.sites.guideLabel)}
            </ButtonLink>
          </div>
          <div className="home-sites__facts">
            {(
              [
                ["Depth", s.depth],
                ["Level", L(s.level)],
                ["Current", L(s.current)],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="home-sites__fact">
                <span className="home-sites__fact-label">{t(label)}</span>
                <span className="home-sites__fact-value">{value || "—"}</span>
              </div>
            ))}
          </div>
          {s.see.length > 0 && (
            <div className="home-sites__see">
              <span className="home-sites__see-label">{L(c.sites.seeLabel)}</span>
              {s.see.slice(0, 4).map((x, k) => (
                <Tag key={k} icon="fish">
                  {L(x.name)}
                </Tag>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Stay({ c, h }: { c: HomeContent; h: Helpers }) {
  const { L, img } = h;
  const [tab, setTab] = useState<number[]>(c.stay.cards.map(() => 0));
  return (
    <section id="b-stay" className="section">
      <div className="home-head home-head--stay">
        <div className="home-head__text">
          {L(c.stay.eyebrow) && <Eyebrow>{L(c.stay.eyebrow)}</Eyebrow>}
          <h2 className="h2">{L(c.stay.title)}</h2>
        </div>
        {L(c.stay.lead) && <p className="home-stay__lead">{L(c.stay.lead)}</p>}
      </div>
      <div className="home-rest">
        {c.stay.cards.map((card, ci) => {
          const f = card.tabs[Math.min(tab[ci] ?? 0, card.tabs.length - 1)];
          if (!f) return null;
          const photo = img(f.photo, "(min-width: 900px) 50vw, 100vw");
          return (
            <article key={ci} className="home-rest__card">
              <div className="home-rest__photo">
                {photo && <img src={photo.src} srcSet={photo.srcSet} sizes={photo.sizes} alt={photo.alt || L(f.title)} />}
                {L(f.stat) && (
                  <div className="home-rest__stat">
                    <span className="home-rest__stat-label">{L(f.statLabel)}</span>
                    <span className="home-rest__stat-value">{L(f.stat)}</span>
                  </div>
                )}
              </div>
              <div className="home-rest__body">
                <div className="home-rest__kicker">{L(card.kicker)}</div>
                <h3 className="home-rest__title">{L(f.title)}</h3>
                <p className="home-rest__text">{L(f.text)}</p>
                <div role="tablist" aria-label={L(card.kicker)} className="home-rest__tabs">
                  {card.tabs.map((ft, j) => (
                    <Button key={j} variant={j === (tab[ci] ?? 0) ? "primary" : "secondary"} size="small" icon={asIcon(ft.icon)} aria-pressed={j === (tab[ci] ?? 0)} onClick={() => setTab((cur) => cur.map((v, k) => (k === ci ? j : v)))}>
                      {L(ft.label)}
                    </Button>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Reviews({ c, h }: { c: HomeContent; h: Helpers }) {
  const { L, t } = h;
  const r = c.reviews;
  const [i, setI] = useState(0);
  const n = r.items.length;
  const rev = r.items[Math.min(i, n - 1)];
  return (
    <section id="b-reviews" className="section home-reviews">
      <div className="home-reviews__split">
        <div className="home-reviews__score">
          {L(r.eyebrow) && <Eyebrow>{L(r.eyebrow)}</Eyebrow>}
          <div className="home-reviews__big">{r.score.toFixed(1)}</div>
          <Rating value={r.score} />
          {L(r.scoreNote) && <div className="home-reviews__from">{L(r.scoreNote)}</div>}
          <div className="home-reviews__links">
            {r.googleUrl && (
              <a href={r.googleUrl} target="_blank" rel="noopener noreferrer">
                {L(r.googleLabel)}
              </a>
            )}
            {r.tripadvisorUrl && (
              <a href={r.tripadvisorUrl} target="_blank" rel="noopener noreferrer">
                {L(r.tripadvisorLabel)}
              </a>
            )}
          </div>
        </div>
        {rev && (
          <figure className="home-reviews__quote">
            <Icon name="quote" size={40} style={{ color: "var(--icon-primary)" }} />
            <blockquote>{L(rev.quote)}</blockquote>
            <figcaption className="home-reviews__cap">
              <AvatarWithText name={rev.name} meta={[L(rev.place), L(rev.date), rev.source].filter(Boolean).join(" · ")} size={48} />
              {n > 1 && (
                <div className="home-reviews__nav">
                  <span className="home-reviews__count">
                    {i + 1} / {n}
                  </span>
                  <Button variant="secondary" size="large" icon="arrow-left" iconOnly aria-label={t("Previous review")} onClick={() => setI((i + n - 1) % n)} />
                  <Button variant="secondary" size="large" icon="arrow-right" iconOnly aria-label={t("Next review")} onClick={() => setI((i + 1) % n)} />
                </div>
              )}
            </figcaption>
          </figure>
        )}
      </div>
    </section>
  );
}

function Faq({ c, h, pages }: { c: HomeContent; h: Helpers; pages: NonNullable<PublishedHome["faqPages"]> }) {
  const { L, t } = h;
  const itemHref = useItemHref();
  return (
    <section id="b-faq" className="section">
      <div className="section-intro home-faq__intro">
        {L(c.faq.eyebrow) && <Eyebrow>{L(c.faq.eyebrow)}</Eyebrow>}
        <h2 className="h2">{L(c.faq.title)}</h2>
      </div>
      <div className="home-faq">
        {c.faq.items.map((f, i) => (
          <div key={i} className="home-faq__item">
            <h3>{L(f.q)}</h3>
            <p>{L(f.a)}</p>
            {f.page && pages[f.page] && (
              <div className="home-faq__more">
                <ButtonLink href={itemHref("faqs", pages[f.page])} variant="text" size="large" icon="arrow-right" iconPosition="suffix">
                  {L(f.moreLabel) || L(c.faq.moreLabel) || t("Read the full answer")}
                </ButtonLink>
              </div>
            )}
          </div>
        ))}
        {L(c.faq.help.title) && (
          <div className="home-faq__help">
            <Icon name="message-circle" size={28} style={{ color: "var(--icon-primary)" }} />
            <h3>{L(c.faq.help.title)}</h3>
            {L(c.faq.help.text) && <p>{L(c.faq.help.text)}</p>}
            {L(c.faq.help.button) && (
              <div>
                <ButtonLink href={waLink()} external variant="primary" size="large" icon="message-circle">
                  {L(c.faq.help.button)}
                </ButtonLink>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function Book({ c, h, b }: { c: HomeContent; h: Helpers; b: Booking }) {
  const { L, t } = h;
  const bk = c.book;
  const { main } = useMoney(c, b.cur);
  const [date, setDate] = useState("");
  const [divers, setDivers] = useState("2 divers");
  const [cert, setCert] = useState("Open Water");
  const [cam, setCam] = useState<"Yes" | "No">("No");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const pk = c.prices.packages.find((p) => p.id === b.pkg) ?? c.prices.packages[0];
  const nDiv = parseInt(divers) || 1;
  const dep = bk.depositPercent / 100;
  return (
    <section id="b-book" data-theme="dark" className="section home-book">
      <div className="home-book__split">
        <div className="home-book__intro">
          {L(bk.eyebrow) && <Eyebrow onDark>{L(bk.eyebrow)}</Eyebrow>}
          <h2 className="home-book__title">{L(bk.title)}</h2>
          {L(bk.lead) && <p className="home-book__lead">{L(bk.lead)}</p>}
          {L(bk.quote.text) && (
            <div className="home-book__quote">
              {bk.quote.rating > 0 && <Rating value={bk.quote.rating} />}
              <p>{L(bk.quote.text)}</p>
              <span>{L(bk.quote.cite)}</span>
            </div>
          )}
        </div>
        <div data-theme="light" className="home-form">
          <div className="home-form__steps">
            {["Choose", "Dates and group", "Confirm"].map((label, i) => {
              const reached = b.step >= i + 1 || b.sent;
              const done = b.step > i + 1 || b.sent;
              return (
                <button key={label} type="button" className="home-form__step" data-reached={reached || undefined} onClick={() => !b.sent && i + 1 < b.step && b.setStep(i + 1)}>
                  <span className="home-form__circle">{done ? <Icon name="check" size={16} /> : b.step === i + 1 ? i + 1 : null}</span>
                  {t(label)}
                </button>
              );
            })}
          </div>
          <div className="home-form__body">
            {!b.sent && b.step === 1 && (
              <div className="home-form__stack">
                {c.prices.packages.map((p) => (
                  <button key={p.id} type="button" className="home-form__pick" data-on={p.id === b.pkg || undefined} onClick={() => b.setPkg(p.id)}>
                    <Icon name={p.id === b.pkg ? "circle-check" : "circle"} size={22} style={{ color: p.id === b.pkg ? "var(--icon-primary)" : "var(--icon-secondary)" }} />
                    <span className="home-form__pick-text">
                      <span className="home-form__pick-name">{L(p.name)}</span>
                      <span className="home-form__pick-meta">{L(p.meta)}</span>
                    </span>
                    <span className="home-form__pick-price">{main(p.priceIdr)}</span>
                  </button>
                ))}
                <div className="home-form__end">
                  <Button variant="primary" size="large" icon="arrow-right" iconPosition="suffix" onClick={() => b.setStep(2)}>
                    {t("Continue")}
                  </Button>
                </div>
              </div>
            )}
            {!b.sent && b.step === 2 && (
              <div className="home-form__grid">
                <Input id="bk-date" label={t("Arrival date")} type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
                <Select id="bk-divers" label={t("Divers")} value={divers} onChange={(e) => setDivers(e.target.value)} options={DIVERS.map((d) => ({ value: d, label: t(d) }))} />
                <Select id="bk-cert" label={t("Certification level")} value={cert} onChange={(e) => setCert(e.target.value)} options={CERTS.map((x) => ({ value: x, label: t(x) }))} />
                <div className="home-form__cam">
                  <div className="tw-field__label">{t("Bringing a camera?")}</div>
                  <div className="home-form__cam-btns">
                    <Button variant={cam === "Yes" ? "primary" : "secondary"} size="small" icon="camera" onClick={() => setCam("Yes")}>
                      {t("Yes")}
                    </Button>
                    <Button variant={cam === "No" ? "primary" : "secondary"} size="small" onClick={() => setCam("No")}>
                      {t("No")}
                    </Button>
                  </div>
                </div>
                <Input id="bk-name" label={t("Name")} required placeholder={t("Your name")} value={name} onChange={(e) => setName(e.target.value)} />
                <Input id="bk-contact" label={t("Email or WhatsApp")} required placeholder="you@email.com" value={contact} onChange={(e) => setContact(e.target.value)} />
                <div className="home-form__nav">
                  <Button variant="secondary" size="large" icon="arrow-left" onClick={() => b.setStep(1)}>
                    {t("Back")}
                  </Button>
                  <Button variant="primary" size="large" icon="arrow-right" iconPosition="suffix" onClick={() => b.setStep(3)}>
                    {t("Review")}
                  </Button>
                </div>
              </div>
            )}
            {!b.sent && b.step === 3 && pk && (
              <div className="home-form__stack home-form__stack--24">
                <div className="home-form__summary">
                  <SumRow label={t("Trip")} value={L(pk.name)} />
                  <SumRow label={t("Arrival")} value={date || t("Not set")} />
                  <SumRow label={t("Group")} value={`${t(divers)} · ${t(cert)}`} />
                  <SumRow label={t("Camera")} value={t(cam === "Yes" ? "Yes, bringing a camera" : "No camera")} />
                  <SumRow label={t("Estimate")} value={`${main(pk.priceIdr)} × ${nDiv} = ${main(pk.priceIdr * nDiv)}`} />
                  <div className="home-form__deposit">
                    <span>{`${t("Deposit")} (${bk.depositPercent}%)`}</span>
                    <span>{main(Math.round(pk.priceIdr * nDiv * dep))}</span>
                  </div>
                </div>
                {L(bk.depositNote) && <Alert>{L(bk.depositNote)}</Alert>}
                <div className="home-form__nav">
                  <Button variant="secondary" size="large" icon="arrow-left" onClick={() => b.setStep(2)}>
                    {t("Back")}
                  </Button>
                  <Button variant="primary" size="xlarge" onClick={() => b.setSent(true)}>
                    {t("Send enquiry")}
                  </Button>
                </div>
                {L(bk.cancellation) && (
                  <p className="home-form__fine">
                    {L(bk.cancellation)} <a href="#b-book">{t("Safety and cancellation policy")}</a>
                  </p>
                )}
              </div>
            )}
            {b.sent && (
              <div className="home-form__stack home-form__stack--24">
                <Alert type="success" description={L(bk.successText)}>
                  {L(bk.successTitle)}
                </Alert>
                <div className="home-form__sent">
                  <ButtonLink href={waLink()} external variant="secondary" size="large" icon="message-circle">
                    {t("Chat on WhatsApp")}
                  </ButtonLink>
                  <Button
                    variant="text"
                    size="large"
                    onClick={() => {
                      b.setSent(false);
                      b.setStep(1);
                    }}
                  >
                    {t("Start again")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function SumRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="home-form__sumrow">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

