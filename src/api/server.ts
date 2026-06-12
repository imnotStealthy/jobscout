import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Config } from "../config.js";
import { FtClient, FtSearchParams } from "../ftClient.js";
import { postFilter } from "../poller.js";
import { normalize } from "../hostFilter.js";

export const RATE_LIMITS = { api: { windowMs: 60_000, max: 30 } };

// Token bucket par IP
const buckets = new Map<string, { count: number; resetAt: number }>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || now > b.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + RATE_LIMITS.api.windowMs });
    return false;
  }
  b.count++;
  return b.count > RATE_LIMITS.api.max;
}

export function createApi(cfg: Config, ft: FtClient): Hono {
  const app = new Hono();

  app.use("*", async (c, next) => {
    await next();
    c.header("X-Content-Type-Options", "nosniff");
    c.header("X-Frame-Options", "DENY");
    c.header("Referrer-Policy", "strict-origin-when-cross-origin");
    c.header("Permissions-Policy", "geolocation=(), camera=(), microphone=()");
  });

  app.use("/api/*", cors({ origin: cfg.corsAllowedOrigins }));

  app.use("/api/*", async (c, next) => {
    const ip = c.req.header("x-forwarded-for")?.split(",")[0].trim() ?? "local";
    if (rateLimited(ip)) return c.json({ error: "rate_limited" }, 429);
    await next();
  });

  app.get("/healthz", (c) => c.json({ status: "ok" }));

  app.get("/api/offers", async (c) => {
    const q = c.req.query("q");
    if (!q || q.length > 200) return c.json({ error: "q required (max 200 chars)" }, 400);

    const params: FtSearchParams = { motsCles: q };
    const commune = c.req.query("commune");
    if (commune && /^\d{5}$/.test(commune)) {
      params.commune = commune;
      const rayon = c.req.query("rayon");
      if (rayon && /^\d{1,3}$/.test(rayon)) params.distance = Number(rayon);
    }
    const rome = c.req.query("rome");
    if (rome && /^[A-Z]\d{4}$/.test(rome)) params.codeROME = rome;
    const dept = c.req.query("dept");
    if (dept && /^\d{1,3}$/.test(dept)) params.departement = dept;

    const offers = await ft.search(params);
    const titre = c.req.query("titre");
    const titres = (titre ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    const fakeProfile = {
      titres: JSON.stringify(titres), teletravail: null,
    } as Parameters<typeof postFilter>[1];
    const kept = postFilter(offers, fakeProfile, cfg.excludedHosts);

    return c.json({
      offers: kept.map((o) => ({
        id: o.id,
        intitule: o.intitule,
        entreprise: o.entreprise?.nom ?? null,
        lieu: o.lieuTravail?.libelle ?? null,
        typeContrat: o.typeContratLibelle ?? o.typeContrat ?? null,
        dateCreation: o.dateCreation ?? null,
        url: o.origineOffre?.urlOrigine ?? o.urlPostulation ?? null,
      })),
    });
  });

  return app;
}
