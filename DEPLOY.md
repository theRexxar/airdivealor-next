# Deploying to Railway

The site runs on [Railway](https://railway.com) as one project with five services. Railway builds the app from the `Dockerfile` on every push to `main`.

| Service | What it is | Config |
| --- | --- | --- |
| **web** | Website + CMS (Next.js) | `railway.json`: runs migrations before each deploy, health check on `/api/health` |
| **worker** | Media processing (sharp, ffmpeg) | `railway.worker.json`: same image, runs the worker, health check on `/health` |
| **MySQL** | Content, users, activity log | Railway MySQL database, with a volume |
| **Redis** | Upload queue (BullMQ), rate limits | Railway Redis database |
| **MinIO** | Photo and video storage (S3-compatible) | A Docker image service with a volume, public at `media.airdivealor.com` |

Why these choices:
- **MinIO instead of Railway Storage Buckets.** Railway Buckets have no public file URLs, and the website serves processed images publicly from `media/`. MinIO keeps the code exactly as tested.
- **One web replica.** The CMS clears the page cache in the web process when someone publishes, so web must run as **one replica**. Don't scale it out without moving that cache first.

## 1. Create the project

1. In Railway, create a new project. Add the **GitHub repo** `theRexxar/airdivealor-next` (branch `main`) and rename the service to **web**.
2. Add the repo again as a second service, named **worker**.
   - **The image picks its role at start** (`scripts/start.sh`). A service whose name contains `worker`, or that has the variable `APP_ROLE=worker`, runs the media worker. Anything else runs the website. So the worker starts as the worker on **every** deploy, whichever config file it reads.
   - **Recommended:** in **Settings → Config-as-code → Railway config file**, set `/railway.worker.json` (with the leading slash). It sets `APP_ROLE=worker`, health-checks `/health`, and always restarts the worker if it stops.
   - **Auto-deploy:** in **Settings → Source**, connect the repo with branch `main`, and keep automatic deploys on. Then every merge to `main` redeploys **both** web and worker. If "Wait for CI" is on, deploys only start after GitHub checks pass.
   - The worker doesn't need a public domain.
3. Add **MySQL** and **Redis** from **New → Database**.
4. Add **MinIO**: **New → Docker image** `chainguard/minio:latest` (the official `minio/minio` image is no longer published on Docker Hub). Name it **MinIO**, then:
   - **Start command:** `minio server /data --address :9000 --console-address :9001`
   - **Volume:** mount at `/data`
   - **Variables:**
     - `MINIO_ROOT_USER`: any name, e.g. `airdive-media`
     - `MINIO_ROOT_PASSWORD`: a long random value
     - `MINIO_API_CORS_ALLOW_ORIGIN`: every address the CMS is opened from, comma-separated, e.g. `https://airdivealor.com,https://new.airdivealor.com`. Uploads from an address that isn't listed stay at **Uploading**.
   - **Networking:** add a public domain on port `9000`. Later, add the custom domain `media.airdivealor.com`.
5. Use a region close to Indonesia (Southeast Asia / Singapore) for all services.

## 2. Variables

On **web**, set these variables. Then use **Shared variables** (or copy them) so **worker** gets the same set. `${{...}}` are Railway references to the other services.

```
NODE_ENV=production
PORT=3000
SITE_URL=https://airdivealor.com
# The website reads CMS content from its own process, not through the internet.
CMS_API_URL=http://127.0.0.1:3000

DATABASE_URL=${{MySQL.MYSQL_URL}}
# family=0 lets ioredis connect over IPv4 or IPv6 on Railway's private network.
REDIS_URL=${{Redis.REDIS_URL}}?family=0

S3_ENDPOINT=http://${{MinIO.RAILWAY_PRIVATE_DOMAIN}}:9000
S3_UPLOAD_ENDPOINT=https://media.airdivealor.com
S3_REGION=us-east-1
S3_ACCESS_KEY=${{MinIO.MINIO_ROOT_USER}}
S3_SECRET_KEY=${{MinIO.MINIO_ROOT_PASSWORD}}
S3_BUCKET=airdivealor-media
S3_PUBLIC_URL=https://media.airdivealor.com/airdivealor-media

BREVO_API_KEY=<from Brevo>
MAIL_FROM_EMAIL=no-reply@airdivealor.com
MAIL_FROM_NAME=Air Dive Alor
# Booking enquiries from the Home page form (the default is contact@airdivealor.com).
ENQUIRY_EMAIL=contact@airdivealor.com

SEED_ADMIN_EMAIL=admin@airdivealor.com
SEED_ADMIN_PASSWORD=<long random value; change it after the first sign-in>
```

In web's **Networking** settings, point the public domain at port `3000`.

Before `media.airdivealor.com` is live, you can test with MinIO's Railway domain instead (`https://<minio>.up.railway.app`) in `S3_UPLOAD_ENDPOINT` and `S3_PUBLIC_URL`. Set it in `MINIO_API_CORS_ALLOW_ORIGIN` too, together with web's Railway domain.

## 3. First deploy

1. Deploy **web** and **worker**. On every deploy, web runs `npm run db:migrate` before it starts (the pre-deploy command in `railway.json`).
2. **Read the startup report in each service's Deploy Logs** (see [After every deploy](#after-every-deploy-the-startup-report)). The worker's report must start with `[start] role: worker` and end with `[worker] waiting for media jobs`.
   - If it says `role: web`, the worker service isn't named `worker`: set the variable `APP_ROLE=worker` on it, or use `/railway.worker.json` as in step 1.2, and redeploy.
   - Jobs queued in the meantime are processed as soon as the worker starts.
3. Open a shell in web with the Railway CLI, `railway ssh` (select the web service), and run:
   - `npm run cms:seed`: roles, the first admin, all page content, dive sites, courses, blog stories and categories, plus the local photos. It is safe to run again: it only adds what is missing. On an existing database it also gives every dive site, course and story the new **Web address (Indonesian)** field (the stories get Indonesian addresses, the rest stay empty, which means "same as English"), and replaces the untranslated Indonesian search titles and descriptions that earlier versions shipped (only where nobody has edited them).
   - `npm run cms:import-remote -- --dry-run`: lists the images still hotlinked from the old `airdivealor.com` and Wix (about 60), and the old-blog links.
   - `npm run cms:import-remote`: copies those images into the media library. This **must run before DNS moves**, while the old site still answers at `airdivealor.com`.
4. Open web's Railway domain (`https://<web>.up.railway.app`) and check:
   - Every page loads, and `/api/health` returns `{"ok":true,...}`.
   - Sign in at `/cms`, change the admin password, and invite the other users.
   - Upload a photo and a short video in **Media**. Both should reach **Ready**, and the worker logs show `[worker] media <id> ready`.
     - Stuck at **Uploading**: the browser couldn't upload to MinIO. Check `MINIO_API_CORS_ALLOW_ORIGIN` and `S3_UPLOAD_ENDPOINT`.
     - Stuck at **Processing**: the worker isn't taking jobs. Check its logs (step 2) and that web and worker use the same `REDIS_URL`.
     - **Failed**: the worker ran but hit an error; the error is shown on the file and in the worker logs.
   - Publish a change; it shows on the site straight away.

## 4. Move airdivealor.com

1. A day before, lower the TTL of the current `airdivealor.com` records (e.g. 300 s).
2. **Add the custom domains in Railway:**
   - web: `airdivealor.com` and `www.airdivealor.com`
   - MinIO: `media.airdivealor.com`
   Railway shows the DNS records to create (CNAME targets and a verification record).
3. **The apex domain** (`airdivealor.com`, with no `www`) needs a DNS provider that supports CNAME flattening or ALIAS records, for example Cloudflare. If the current DNS provider can't do this, move the DNS to one that can first.
4. **Change only the web records.** Leave the **MX**, SPF, DKIM and other mail records exactly as they are, or email at airdivealor.com stops working.
5. Update `MINIO_API_CORS_ALLOW_ORIGIN` to `https://airdivealor.com` if you changed it for testing, and confirm `SITE_URL`, `S3_UPLOAD_ENDPOINT` and `S3_PUBLIC_URL` use the real domains.
6. When the certificates show as issued in Railway, check the site, the CMS sign-in, an upload, and a password-reset email.

### Language addresses

The site's pages are under `/en/...` and `/id/...`. Every old address without a language (`/dive-sites/kals-dream`, `/blog/kanaloa`) redirects to the English page (308), so links and search results that point at the new site keep working. After the move, submit `https://airdivealor.com/sitemap.xml` in Google Search Console: it lists both languages.

### Decide before the move: old blog links

5 blog stories haven't been moved yet. They show their excerpt plus a link to the full story on the old WordPress blog (`airdivealor.com/blog/...`). After the DNS move, those links will point at the new site and break. Choose one:
- move those stories into the CMS (paste the text into the story's **Story** blocks), or
- keep the old blog on another address (e.g. `old.airdivealor.com`) and update each story's **Old blog link**.

`npm run cms:import-remote -- --dry-run` lists these links.

## After every deploy: the startup report

When a deploy starts, both services print what they are running and whether everything they need is reachable. No passwords or keys are printed, only hosts, names and whether a key is set. Railway → service → **Deployments** → the deploy → **Deploy Logs**:

```
[start] role: worker (APP_ROLE=worker, service=worker)
[worker] health check on port 8080
[worker] ── Air Dive Alor media worker started ──
[worker] deployment: service worker, environment production, commit 3f9c2e1 (main), deployment 8c1d2e3f
[worker] queue "media-processing", 2 jobs at a time, 3 attempts per file
[worker] ✓ mysql   mysql.railway.internal:3306/railway, 2 migrations applied
[worker] ✓ redis   redis.railway.internal:6379; media queue: 0 waiting, 0 active, 0 retrying, 0 failed
[worker] ✓ storage endpoint minio.railway.internal:9000, bucket airdivealor-media, public https://media.airdivealor.com/airdivealor-media
[worker] ✓ ffmpeg  ffmpeg version 5.1.x; ffprobe version 5.1.x
[worker] ✓ ready: all checks passed
[worker] waiting for media jobs
```

The website prints the same report with `[web]`, plus the site URL and an **email** line. The email line checks the Brevo key against Brevo, which catches a missing key, an SMTP key or an "unrecognised IP address".

The symbols:
- `✓`: OK.
- `!`: a warning; the service still runs. Example: `! email BREVO_API_KEY is not set`, which means invitations, password emails and booking enquiries are **not** sent (the booking form then tells visitors to use WhatsApp).
- `✗`: a problem. The health check (`/api/health` for web, `/health` for worker) then answers 503, so Railway doesn't switch to the broken deploy.

The worker's `/health` also shows its queue and how many files it has processed since it started.

## 5. Running it

- **Deploys:** merge to `main`. Railway builds the image and redeploys web and worker.
  - Migrations run before the new version starts. They hold a database lock, so web and worker deploying together never apply one twice.
  - Each service switches over once its health check passes.
  - Check the startup report afterwards.
- **Backups:**
  - Turn on volume backups for **MySQL** and **MinIO** in Railway (volume → Backups) and set a schedule.
  - Also take an occasional off-site copy:
    - Database: `mysqldump`, via `railway ssh` or a TCP proxy.
    - Media: `mc mirror`, from the MinIO public domain.
  - Try a restore once.
- **Logs and metrics:** each service's **Deployments → Logs** and **Metrics** tabs.
- **Uptime:** an external monitor on `https://airdivealor.com/api/health` (e.g. UptimeRobot).
- **Cost:** Railway bills the plan fee plus usage (CPU, RAM, volume storage, egress). With five small services, expect roughly US$10–30 a month; check the usage page after the first week.

## Things to confirm on the first deploy

These come from Railway's documented behaviour but couldn't be tried here:
- **Upload size limit:** MinIO uploads of large videos (up to 300 MB) through Railway's public domain. If they fail, lower the video limit in `lib/cms/media-rules.ts`.
- **Command names:** the `railway ssh` command, and the variable names offered by the MySQL/Redis templates (`MYSQL_URL`, `REDIS_URL`). Railway shows them on each database's **Variables** tab.
