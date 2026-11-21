/**
 * The visitor's real IP address, for rate limits and the activity log.
 *
 * The site runs behind Cloudflare: browser → Cloudflare → Railway → app. Headers a browser sends can't be
 * trusted (anyone can send "X-Forwarded-For: 1.2.3.4"), so:
 * 1. CF-Connecting-IP: Cloudflare sets it to the address it received the request from, replacing any
 *    value the browser sent. Trusted when the request proves it came through Cloudflare (the origin
 *    secret below), or when no secret is configured yet.
 * 2. Otherwise the LAST X-Forwarded-For entry: proxies add the address they received the request from
 *    at the end, so the first entries are whatever the sender wrote and the last one is not.
 * 3. Otherwise X-Real-IP.
 *
 * Origin secret (CF_ORIGIN_SECRET): a Cloudflare Transform Rule adds the header `X-Origin-Secret` with this
 * value to every request it forwards. Only Cloudflare knows it, so a request carrying it came through
 * Cloudflare, and with the secret set, proxy.ts refuses requests that don't (nobody can skip Cloudflare by
 * calling the Railway address directly). See DEPLOY.md.
 *
 * Shared by proxy.ts and route handlers, so it only uses web APIs.
 */
export const ORIGIN_SECRET_HEADER = "x-origin-secret";

const IP = /^[0-9a-fA-F:.]{2,45}$/;
const valid = (v: string | null | undefined) => {
  const s = v?.trim();
  return s && IP.test(s) ? s : "";
};

/** Compare without stopping at the first different character, so timing reveals nothing about the secret. */
function sameSecret(a: string, b: string) {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

/** The configured origin secret, or "" when the check is off. */
export const originSecret = () => (process.env.CF_ORIGIN_SECRET ?? "").trim();

/** True when the request carries the origin secret (it came through Cloudflare). False when no secret is set. */
export function fromCloudflare(h: Headers): boolean {
  const secret = originSecret();
  return !!secret && sameSecret(h.get(ORIGIN_SECRET_HEADER) ?? "", secret);
}

export function clientIp(h: Headers): string {
  const cf = valid(h.get("cf-connecting-ip"));
  if (cf && (!originSecret() || fromCloudflare(h))) return cf;
  const chain = (h.get("x-forwarded-for") ?? "").split(",");
  return valid(chain[chain.length - 1]) || valid(h.get("x-real-ip"));
}
