# One image for the website, the media worker and the CMS scripts (migrate, seed, import).
# Railway builds it from this file (see railway.json and railway.worker.json). Local build: docker build -t airdivealor .

FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM deps AS build
ENV NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS run
# ffmpeg/ffprobe: the worker turns uploaded videos into web MP4s and posters.
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
# Dev dependencies stay: the worker and the CMS scripts run with tsx.
COPY --from=build --chown=node:node /app ./
USER node
EXPOSE 3000
# Website or media worker, chosen by APP_ROLE or the Railway service name (see scripts/start.sh).
CMD ["sh", "scripts/start.sh"]
