import type Database from "better-sqlite3";
import type { Config } from "./config.js";
import { FtClient, FtOffer, FtSearchParams, offerOriginUrl } from "./ftClient.js";
import { hasSeen, listEnabledProfiles, markSeen, ProfileRow } from "./db.js";
import { isExcludedHost, normalize, safeHost } from "./hostFilter.js";

const parseJsonArr = (s: string | null): string[] =>
  s ? (JSON.parse(s) as string[]) : [];

export function buildQueries(p: ProfileRow): FtSearchParams[] {
  const keywords = parseJsonArr(p.keywords);
  const base: FtSearchParams = {};
  if (keywords.length) base.motsCles = keywords.join(",");
  const romes = parseJsonArr(p.rome_codes);
  if (romes.length) base.codeROME = romes.join(",");
  const appellations = parseJsonArr(p.appellations);
  if (appellations.length) base.appellation = appellations.join(",");
  const contrats = parseJsonArr(p.type_contrat);
  if (contrats.length) base.typeContrat = contrats.join(",");

  const communes = parseJsonArr(p.communes);
  const departements = parseJsonArr(p.departements);
  const regions = parseJsonArr(p.regions);

  const queries: FtSearchParams[] = [];
  for (const c of communes) {
    const q: FtSearchParams = { ...base, commune: c };
    if (p.rayon_km != null) q.distance = p.rayon_km;
    queries.push(q);
  }
  if (departements.length) queries.push({ ...base, departement: departements.join(",") });
  if (regions.length) queries.push({ ...base, region: regions.join(",") });
  if (!queries.length) queries.push(base);
  return queries;
}

// Post-filtre §5.2 (ordre strict), hors dédup seen (faite par l'appelant)
export function postFilter(offers: FtOffer[], p: ProfileRow, excludedHosts: string[]): FtOffer[] {
  const titres = parseJsonArr(p.titres).map(normalize).filter(Boolean);
  return offers.filter((o) => {
    const host = safeHost(offerOriginUrl(o));
    if (isExcludedHost(host, excludedHosts)) return false;
    if (titres.length) {
      const intitule = normalize(o.intitule ?? "");
      if (!titres.some((t) => intitule.includes(t))) return false;
    }
    if (p.teletravail === 1) {
      const txt = normalize(`${o.intitule ?? ""} ${o.description ?? ""}`);
      if (!txt.includes("teletravail") && !txt.includes("remote")) return false;
    }
    return true;
  });
}

export interface PollResult {
  profile: ProfileRow;
  offers: FtOffer[];
}

export async function runProfile(
  ft: FtClient,
  db: Database.Database,
  p: ProfileRow,
  excludedHosts: string[],
): Promise<FtOffer[]> {
  const seen = new Map<string, FtOffer>();
  for (const q of buildQueries(p)) {
    try {
      for (const o of await ft.search(q)) seen.set(o.id, o);
    } catch (err) {
      console.error(`[poll] profile ${p.id} query failed:`, (err as Error).message);
    }
  }
  return postFilter([...seen.values()], p, excludedHosts).filter(
    (o) => !hasSeen(db, p.id, o.id),
  );
}

export async function pollAll(
  ft: FtClient,
  db: Database.Database,
  cfg: Config,
  post: (p: ProfileRow, o: FtOffer) => Promise<void>,
): Promise<void> {
  for (const p of listEnabledProfiles(db)) {
    const fresh = await runProfile(ft, db, p, cfg.excludedHosts);
    for (const o of fresh) {
      try {
        await post(p, o);
        markSeen(db, p.id, o.id);
      } catch (err) {
        console.error(`[poll] post failed (profile ${p.id}, offer ${o.id}):`, (err as Error).message);
      }
    }
    if (fresh.length) console.log(`[poll] profile ${p.id} (${p.label}): ${fresh.length} new offers`);
  }
}
