# Air Dive Alor website (Next.js)

Built from the Claude Design prototypes for the Air Dive Alor site (Airdivealor website mockups).

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
```

## Pages

Every page has an English and an Indonesian address. English is the default.

| English | Indonesian | Prototype |
| --- | --- | --- |
| `/en` | `/id` | `HomeDescent.dc.html`: loading screen, depth gauge, prices, why Alor, dive sites, safety stop, reviews, FAQ and the 3-step booking form (`#b-prices`, `#b-faq`, `#b-book`) |
| `/en/dive-sites`, `/en/dive-sites/[slug]` | `/id/titik-selam`, `/id/titik-selam/[slug]` | `DiveSites.dc.html`: 33 sites, 9 at a time, and a guide page per site |
| `/en/facilities-and-rates` | `/id/fasilitas-dan-tarif` | `FacilitiesRates.dc.html` |
| `/en/dive-courses`, `/en/dive-courses/[id]` | `/id/kursus-selam`, `/id/kursus-selam/[id]` | `DiveCourses.dc.html`: 12 courses and a detail page per course |
| `/en/about-us` | `/id/tentang-kami` | `AboutUs.dc.html` |
| `/en/blog`, `/en/blog/[slug]` | `/id/blog`, `/id/blog/[slug]` | `Blog.dc.html`, `BlogPost.dc.html` |

The prototypes' overlays (site guide, course detail, story picker) are real pages here, so each one has its own link.

## Content and translations

- Content is in `lib/`: `home-data.ts`, `sites-data.ts`, `courses-data.ts`, `blog-data.ts`, all generated from the prototype data files. Edit them there.
- **Languages in the URL** (`lib/i18n-routes.ts`, `proxy.ts`):
  - The app's folders are `app/[lang]/...` with the English segment names. The proxy serves the Indonesian segments (`/id/titik-selam/...`) from those folders, and redirects a segment in the wrong language (`/id/dive-sites` → `/id/titik-selam`).
  - Addresses without a language (old links, `/dive-sites`) redirect to the visitor's last language (cookie `lang`), or to English.
  - Dive sites, courses and stories have an English **Web address** and an optional **Web address (Indonesian)** in the CMS. Without an Indonesian one, the English address is used under `/id`. Opening an item with the other language's address redirects to the right one.
  - The **EN / ID** switch (`components/LangSwitch.tsx`) goes to the same page in the other language, with its own address. Each page passes both addresses to it through `AlternatesProvider`.
  - Links in content (`/dive-courses`, `/#b-faq`) are put into the current language as they render (`components/LocalLink.tsx`), so CMS texts don't need a language prefix.
- Interface texts: `lib/i18n.tsx`. The dictionary comes from the prototypes (`lib/i18n-dict.ts`, `lib/page-dicts.ts`, and the site text in `lib/sites-data.ts`), plus a few strings added in `lib/i18n.tsx`. As in the prototypes, course descriptions and some data values stay in English.
- Design tokens are in `app/tokens.css`. Buttons, tags, alerts, form fields, ratings and icons copy the design system, including its Lucide icon font (`app/fonts/lucide.woff2`).

## Photos

- `public/latest`: photos the client placed in the design. `public/sites`: underwater photos. `public/brand`: logos.
- Other photos still load from airdivealor.com and static.wixstatic.com.

## Still placeholder

These come from the prototypes and need confirming: home prices and package details, "4.9 / 180+ reviews", "2,000+ divers", and the dive-site notes marked as drafts.

---

# CMS (all main pages)

The Home, Dive sites, Facilities and rates, Dive courses, About us and Blog pages, every blog story, every dive site guide and every dive course are managed in a CMS that lives in this app at `/cms`. It uses MySQL for content and users, MinIO for photos and videos, Redis with BullMQ for background media processing, and Brevo for emails.

## Run it locally

```bash
cp .env.example .env          # then set SEED_ADMIN_PASSWORD (and BREVO_API_KEY to send real emails)
docker compose up -d          # MySQL, Redis, MinIO
npm install
npm run db:migrate            # create tables
npm run cms:seed              # roles, first admin, page content, dive sites, courses, blog stories and categories, import their photos
npm run dev                   # website + CMS on http://localhost:3000, sign in at /cms
npm run worker                # in a second terminal: processes uploads
```

In production, run `npm run build && npm start` for the app and `npm run worker` as a separate long-running process. The worker needs `ffmpeg` and `ffprobe` installed.

**SEO and AI crawlers:**
- **Every page:** title, description, canonical URL, Open Graph and Twitter card from its CMS "SEO and sharing" section, or from the item for detail pages. URLs are made absolute with `SITE_URL`. Tags are always in `<head>`, for AI crawlers too (`htmlLimitedBots` in `next.config.ts`).
- **Per language:** each page's canonical URL is its own language's address, with `hreflang` links to both versions (`x-default` is English), `og:locale` (`en_US` / `id_ID`), `<html lang>`, and the title and description in that language.
- **Structured data:** every page carries schema.org JSON-LD in its language (`inLanguage`, localized names and breadcrumbs) (`lib/seo/jsonld.ts`, rendered by `components/JsonLd.tsx`):
  - all pages: the dive center as a local business, and the website
  - Home: FAQ
  - Dive sites: list, plus each site as a tourist attraction
  - Facilities: priced packages
  - Courses: each with its price
  - About: about page
  - Blog: the blog and its posts
  - inner pages: breadcrumbs
- **Built-in routes** (from published CMS content, always current):
  - `/sitemap.xml`: every page in both languages, each with its `hreflang` alternates
  - `/robots.txt`: CMS and APIs blocked; search engines and AI crawlers allowed
  - `/llms.txt`: a Markdown summary for AI assistants (English links, and how the Indonesian addresses work)
- **CMS sign-in pages** are `noindex`.

**Deploying:** the site runs on Railway (web, worker, MySQL, Redis, MinIO), built from the `Dockerfile`. See [DEPLOY.md](DEPLOY.md) for the setup, the variables, and moving `airdivealor.com`. Before the DNS move, run `npm run cms:import-remote` to copy images still hotlinked from the old site into the media library.

## How it fits together

| Piece | Where |
| --- | --- |
| Page and collection registry (drives the API, CMS sidebar, start page and permissions) | `lib/cms/registry.ts` |
| Section and item definitions: fields, validation, editor form | `lib/cms/home-sections.ts`, `lib/cms/dive-sites-sections.ts`, `lib/cms/facilities-sections.ts`, `lib/cms/courses-sections.ts`, `lib/cms/about-sections.ts`, `lib/cms/blog-sections.ts`, `lib/cms/site-fields.ts`, `lib/cms/post-fields.ts`, `lib/cms/course-fields.ts`, `lib/cms/fields.ts` |
| Database schema and migrations (Drizzle ORM) | `lib/server/db/schema.ts`, `drizzle/` |
| Admin API (session cookie, permission-checked) | `app/api/cms/**` |
| Public API the website reads | `GET /api/public/pages/{home,dive-sites,facilities,dive-courses,about-us,blog}`, `GET /api/public/sites/{slug}`, `GET /api/public/courses/{slug}`, `GET /api/public/posts/{slug}` |
| CMS screens | `app/cms/**`, `components/cms/**` |
| Media worker (sharp, ffmpeg) | `scripts/worker.ts` |

**Content workflow:** each page section has its own editor.
- **Home:** SEO, Hero, Awards, Prices, Why Alor, Dive sites (picks guides from the collection), Safety stop, Reviews, FAQ, Book.
- **Dive sites:** SEO, Site guide texts (shared labels and notes on every guide page), Hero, Highlights, Site list (title, page size, filter buttons, note), Call to action.
- **Dive courses:** SEO, Course pages (texts shared by every course page: booking message and button, not-included list, requirements, closing box), Hero (title, intro, agency logos), Course list (level filter buttons, card buttons), Call to action.
- **About us:** SEO, Hero (title, intro, photo, key facts), Our story (paragraphs, hosts, photo gallery with lightbox), Our name (text and meaning cards), Our boats (photo, text, specs), Call to action.
- **Blog:** SEO, Story pages (texts shared by every story page: closing box and its WhatsApp message, “More stories”, the note on stories still on the old blog), Featured story (pick one, or leave empty for the newest), Story list (title, filters, stories per page), Call to action.
- **Facilities and rates:** SEO, Hero, Rates at a glance, Stay, Diving, Boats, Gear and equipment, Diving rates, Call to action. In Diving rates, each package has a price table (days, nights, dives, price) or, when the table is empty, price cards (for pay per dive), plus its included and not-included lists. Tapping a table row opens WhatsApp with a message built from the row.
- **Saving** stores a draft.
- **Publishing** copies the draft to the live version and clears the page cache straight away.
- **Preview drafts** (`/cms/preview/<page>`, e.g. `/cms/preview/home`) shows unpublished changes.
- **Order and visibility:** sections can be reordered and hidden. These changes apply to the live page as soon as they're saved.
- **Languages:** every text field has English and Indonesian. When the Indonesian is empty, visitors see the English.

**Dive site guides (a collection):** the 33 sites live under *Content › Dive site guides* (`/cms/collections/sites`). Each guide is one item with its own draft and live version.
- **New / edit:** name, web address (`/dive-sites/<web-address>`), conditions, photos and gallery, dive types, marine life, access and safety, tips, photo credit.
- **Publish / unpublish:** a new or unpublished guide isn't on the website. Preview it at `/cms/preview/sites/<id>`.
- **Hide / show:** a hidden guide disappears from the list and its page returns 404, without losing the published version.
- **Order:** move guides up or down and save; this is the order on the Dive sites page and the guide's previous/next links.
- **Delete** is refused while a page still uses the guide (for example the Home "Dive sites" section).
- **Filters** on the Dive sites page match words against each guide's English dive types (e.g. `wall` or `muck, macro`).

**Dive courses (a collection):** the 12 courses live under *Content › Dive course packages* (`/cms/collections/courses`) and work like the dive site guides: draft, preview (`/cms/preview/courses/<id>`), publish, unpublish, hide, reorder, create and delete. Each course has its card fields (name, level, price, stay, dives, photo, intro), what's included (icon, item, details), the at-a-glance numbers, prerequisite and group size, what you'll learn, the day-by-day plan and instructor tips. The level filters on the Dive courses page match each course's level.

**Blog stories and categories (collections):** stories live under *Content › Blog stories* (`/cms/collections/posts`) and are listed newest first by their date, not by hand.
- **Fields:** title, excerpt, date, category (picked from *Blog categories*), author and initials, cover photo, and an optional link to the old blog.
- **Body:** built from blocks: paragraph, heading, image, gallery, checklist, quote, facts, button link. Add a block, then reorder, duplicate or remove blocks.
- **No body:** a story without a body shows its excerpt and a link to the old blog.
- **Categories:** become the blog's filter buttons, in their list order.
- **Deleting:** refused while something still uses the item: a category used by stories, or the story picked as featured.

**Website connection:** `app/page.tsx`, `app/dive-sites/page.tsx`, `app/dive-sites/[slug]/page.tsx`, `app/facilities-and-rates/page.tsx`, `app/dive-courses/page.tsx`, `app/dive-courses/[id]/page.tsx`, `app/about-us/page.tsx`, `app/blog/page.tsx` and `app/blog/[slug]/page.tsx` fetch the public API. Responses are cached for 5 minutes and refreshed the moment someone publishes. If the CMS can't be reached, the pages fall back to the built-in content in `lib/cms/home-defaults.ts`, `lib/cms/dive-sites-defaults.ts`, `lib/cms/facilities-defaults.ts`, `lib/cms/courses-defaults.ts`, `lib/cms/about-defaults.ts` and `lib/cms/blog-defaults.ts`. Set `CMS_API_URL` if the API runs somewhere else.

**Uploads (asynchronous):**
1. The browser registers the file and gets a presigned URL.
2. It uploads straight to MinIO (`originals/`, private).
3. It calls `/complete`, which queues a BullMQ job.
4. The worker writes WebP images at 480 / 960 / 1600 / 2400 px, or for videos an H.264 MP4 plus a poster, to `media/` (public).
5. Jobs retry 3 times with backoff. Failed files can be retried from the library.

Limits are 25 MB per image and 300 MB per video. Browsers upload directly, so the MinIO address must be reachable from the browser (set `S3_UPLOAD_ENDPOINT` if the server uses an internal hostname), and MinIO must allow your site's origin for CORS (`MINIO_API_CORS_ALLOW_ORIGIN`).

## Users and permissions (RBAC)

- **Users** are invited by email and set their own password from the invitation link (valid 7 days).
- **Forgot password** emails a one-time link valid for 1 hour, sent through Brevo. Asking again cancels the earlier link, and the form answers the same way whether or not the address has an account.
- **Password changed:** after a reset, or a change in Account settings, the owner gets an email, so they notice if it wasn't them. A reset also signs out every other device.
- **Booking enquiries** (the Home page form, `#b-book`) go to `POST /api/public/enquiry` (`app/api/public/enquiry/route.ts`).
  - **Who gets an email:** the team at `ENQUIRY_EMAIL` (default `contact@airdivealor.com`; replies go to the customer, and a "Reply on WhatsApp" button opens a chat when a phone number was given), and the customer, who gets a copy at the email they entered, in the language they used, with replies going to the team.
  - **Form fields:** package, arrival date (not before today), number of divers (1 to 50), certification, camera, name, email, WhatsApp or phone (optional, with country code) and a message (optional, up to 2,000 characters). The same rules are checked in the browser and on the server (`lib/enquiry.ts`); errors show under each field, in English or Indonesian.
  - **Prices** in the emails are worked out on the server from the published Home page prices, in the currency the visitor chose (the team also sees rupiah).
  - **If the team's email can't be sent** (Brevo not set up or failing), the visitor sees an error with a WhatsApp link instead of "Enquiry sent", and the enquiry is written to the server log (`[enquiry] NOT DELIVERED …`). If only the customer's copy fails, the enquiry still counts as sent and the visitor is told no copy was emailed.
  - **Spam:** 5 enquiries per 15 minutes per address, a hidden field that bots fill in, and requests from other sites are refused.
- **Emails** (invitation, password reset, password changed, booking enquiry) are in English and Indonesian, with an HTML and a plain-text version (`lib/server/emails.ts`). **CMS › Email** (Super admin, or anyone with "Invite, edit and disable users") shows whether Brevo is connected, previews every template, and sends a test to yourself. Without `BREVO_API_KEY`, emails are only printed to the server log, and the CMS says no email was sent (it never reports an invitation as sent when it wasn't). Each email Brevo accepts is logged with its Brevo message id (`[mail] sent … (Brevo <id>)`), to look it up in Brevo → Transactional → Logs.
- **If an invitation email fails**, the user is still added: the CMS says so, and "Resend invite" sends a fresh link (earlier links stop working).
- **Roles** are sets of permissions, and a user gets every permission from all their roles. Permissions:
  - per page (Home, Dive sites, Facilities and rates, Dive courses, About us, Blog): view, one edit permission per section, publish, change layout
  - per collection (Dive site guides, Dive course packages, Blog stories, Blog categories): view, add/edit drafts, publish/hide/unpublish/reorder, delete
  - Media: view, upload, delete
  - Users: view, manage
  - Roles: manage
  - Activity log: view
- **Built-in roles:**
  - **Super admin**: every permission. It can't be changed, and the last Super admin can't be removed.
  - **Editor**: edit and publish all pages and content (dive sites, courses, blog), upload media.
  - **Contributor**: edit drafts and upload media; can't publish.
  - **Viewer**: read only.
- **Security:**
  - Passwords are hashed with bcrypt.
  - Sessions are random tokens stored hashed, in an httpOnly cookie that lasts 7 days.
  - Sign-in and reset are rate-limited in Redis.
  - Every write checks the request's Origin.
  - All changes are recorded in the activity log.
