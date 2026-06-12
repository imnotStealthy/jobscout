import type Database from "better-sqlite3";
import type { Config } from "./config.js";
import { AdzunaClient, AdzunaSearchParams } from "./adzunaClient.js";
import { CareerjetClient, CareerjetSearchParams } from "./careerjetClient.js";
import { FtClient, FtOffer, FtSearchParams, offerOriginUrl } from "./ftClient.js";
import { GreenhouseClient } from "./greenhouseClient.js";
import { LbaClient, LbaSearchParams } from "./lbaClient.js";
import { LeverClient } from "./leverClient.js";
import { SmartRecruitersClient } from "./smartrecruitersClient.js";
import { deleteProfile, hasSeen, listEnabledProfiles, markSeen, ProfileRow } from "./db.js";
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
  const regions = parseJsonArr(p.regions).map(regionCode).filter(Boolean);

  const queries: FtSearchParams[] = [];
  for (const c of communes) {
    const dept = postalCodeDepartment(c);
    if (dept) {
      queries.push({ ...base, departement: dept });
      continue;
    }
    const q: FtSearchParams = { ...base, commune: c };
    if (p.rayon_km != null) q.distance = p.rayon_km;
    queries.push(q);
  }
  if (departements.length) queries.push({ ...base, departement: departements.join(",") });
  if (regions.length) queries.push({ ...base, region: regions.join(",") });
  if (!queries.length) queries.push(base);
  if (keywords.length > 1) {
    const scopedQueries = [...queries];
    const contractKeyword = primaryContractKeyword(keywords);
    if (contractKeyword) {
      queries.push(...scopedQueries.map((q) => ({ ...q, motsCles: `${keywords[0]},${contractKeyword}` })));
    }
    queries.push(...scopedQueries.map((q) => ({ ...q, motsCles: keywords[0] })));
  }
  return queries;
}

export function buildLbaQueries(p: ProfileRow): LbaSearchParams[] {
  if (!isAlternanceProfile(p)) return [];

  const base: LbaSearchParams = {};
  const romes = parseJsonArr(p.rome_codes);
  if (romes.length) base.romes = romes.join(",");
  if (p.rayon_km != null) base.radius = p.rayon_km;

  const departements = [
    ...parseJsonArr(p.departements),
    ...parseJsonArr(p.communes).map(communeDepartment).filter((d): d is string => Boolean(d)),
    ...parseJsonArr(p.regions).flatMap(regionDepartments),
  ];
  const uniqDept = [...new Set(departements)];
  return uniqDept.length ? [{ ...base, departements: uniqDept }] : [base];
}

export function buildAdzunaQueries(p: ProfileRow): AdzunaSearchParams[] {
  const keywords = parseJsonArr(p.keywords);
  const contract = wantedContract(keywords.map(normalize));
  if (contract === "alternance") return [];
  const whatValues = adzunaWhatValues(keywords, contract);

  const base: AdzunaSearchParams = {
    permanent: contract === "cdi" ? true : undefined,
  };
  if (p.rayon_km != null) base.distance = p.rayon_km;

  const locations = [
    ...parseJsonArr(p.communes).map(externalLocationLabel),
    ...parseJsonArr(p.departements).map(externalLocationLabel),
    ...parseJsonArr(p.regions).map(regionLabel),
  ].filter(Boolean);
  const uniqLocations = [...new Set(locations)];
  const scopes = uniqLocations.length ? uniqLocations.map((where) => ({ ...base, where })) : [base];
  return scopes.flatMap((scope) => whatValues.map((what) => ({ ...scope, what })));
}

export function buildCareerjetQueries(p: ProfileRow): CareerjetSearchParams[] {
  const keywords = parseJsonArr(p.keywords);
  const contract = wantedContract(keywords.map(normalize));
  if (contract === "alternance") return [];
  const keywordValues = searchKeywordValues(keywords, contract);

  const base: CareerjetSearchParams = {
    contractType: careerjetContractType(contract),
  };
  if (p.rayon_km != null) base.radius = p.rayon_km;

  const locations = [
    ...parseJsonArr(p.communes).map(externalLocationLabel),
    ...parseJsonArr(p.departements).map(externalLocationLabel),
    ...parseJsonArr(p.regions).map(regionLabel),
  ].filter(Boolean);
  const uniqLocations = [...new Set(locations)];
  const scopes = uniqLocations.length ? uniqLocations.map((location) => ({ ...base, location })) : [base];
  return scopes.flatMap((scope) => keywordValues.map((keywords) => ({ ...scope, keywords })));
}

function adzunaWhatValues(keywords: string[], contract: ReturnType<typeof wantedContract>): string[] {
  return searchKeywordValues(keywords, contract);
}

function searchKeywordValues(keywords: string[], contract: ReturnType<typeof wantedContract>): string[] {
  const values = new Set<string>();
  const exact = keywords.join(" ").trim();
  if (exact) values.add(exact);

  const first = keywords[0]?.trim();
  const contractKeyword = contract ? (contract === "interim" ? "interim" : contract.toUpperCase()) : null;
  if (first && contractKeyword && first.includes(" ")) {
    const primary = first.split(/\s+/)[0];
    if (primary) values.add(`${primary} ${contractKeyword}`);
  }

  return [...values];
}

function careerjetContractType(contract: ReturnType<typeof wantedContract>): CareerjetSearchParams["contractType"] {
  if (contract === "cdi") return "p";
  if (contract === "cdd") return "c";
  if (contract === "interim") return "t";
  if (contract === "stage") return "i";
  if (contract === "vie") return "v";
  return undefined;
}

function primaryContractKeyword(keywords: string[]): string | null {
  const normalized = keywords.map((k) => normalize(k));
  if (normalized.some((k) => ["alternance", "apprentissage", "contrat pro", "professionnalisation", "professionalisation"].includes(k))) {
    return "alternance";
  }
  if (normalized.some((k) => ["stage", "stagiaire"].includes(k))) return "stage";
  if (normalized.some((k) => ["interim", "interimaire"].includes(k))) return "interim";
  if (normalized.some((k) => ["vie", "volontariat international"].includes(k))) return "VIE";
  return null;
}

function postalCodeDepartment(value: string): string | null {
  if (!/^\d{5}$/.test(value) || !value.endsWith("000")) return null;
  return value.startsWith("97") || value.startsWith("98") ? value.slice(0, 3) : value.slice(0, 2);
}

function communeDepartment(value: string): string | null {
  if (!/^\d{5}$/.test(value)) return null;
  return value.startsWith("97") || value.startsWith("98") ? value.slice(0, 3) : value.slice(0, 2);
}

function regionCode(value: string): string {
  const v = normalize(value).replace(/[\s_-]/g, "");
  const map: Record<string, string> = {
    idf: "11",
    iledefrance: "11",
    "ile-de-france": "11",
  };
  return map[v] ?? value;
}

function regionDepartments(value: string): string[] {
  const code = regionCode(value);
  if (code === "11") return ["75", "77", "78", "91", "92", "93", "94", "95"];
  return [];
}

function regionLabel(value: string): string {
  return regionCode(value) === "11" ? "Ile-de-France" : value;
}

function externalLocationLabel(value: string): string {
  const dept = communeDepartment(value) ?? value;
  const map: Record<string, string> = {
    "75": "Paris",
    "77": "Seine-et-Marne",
    "78": "Yvelines",
    "91": "Essonne",
    "92": "Hauts-de-Seine",
    "93": "Seine-Saint-Denis",
    "94": "Val-de-Marne",
    "95": "Val-d'Oise",
  };
  return map[dept] ?? value;
}

// Post-filtre §5.2 (ordre strict), hors dédup seen (faite par l'appelant)
export function postFilter(offers: FtOffer[], p: ProfileRow, excludedHosts: string[]): FtOffer[] {
  const titres = parseJsonArr(p.titres).map(normalize).filter(Boolean);
  const keywords = parseJsonArr(p.keywords).map(normalize);
  const contract = wantedContract(keywords);
  return offers.filter((o) => {
    const host = safeHost(offerOriginUrl(o));
    if (isExcludedHost(host, excludedHosts)) return false;
    if (titres.length) {
      const intitule = normalize(o.intitule ?? "");
      const searchable = normalize(`${o.intitule ?? ""} ${o.description ?? ""}`);
      if (!titres.some((t) => titleMatches(intitule, t) || titleMatches(searchable, t)))
        return false;
    }
    if (p.teletravail === 1) {
      const txt = normalize(`${o.intitule ?? ""} ${o.description ?? ""}`);
      if (!txt.includes("teletravail") && !txt.includes("remote")) return false;
    }
    if (contract === "alternance") {
      const txt = normalize(`${o.intitule ?? ""} ${o.description ?? ""} ${o.typeContratLibelle ?? ""}`);
      const contractText = normalize(`${o.typeContrat ?? ""} ${o.typeContratLibelle ?? ""}`);
      if (contractText.includes("cdi") || contractText.includes("interim") || contractText.includes("mis")) return false;
      if (!txt.includes("alternance") && !txt.includes("alternant") &&
          !txt.includes("apprentissage") && !txt.includes("contrat pro") &&
          !txt.includes("professionnalisation") && !txt.includes("professionalisation")) return false;
    }
    if (contract === "vie") {
      const txt = normalize(`${o.intitule ?? ""} ${o.description ?? ""} ${o.typeContrat ?? ""} ${o.typeContratLibelle ?? ""}`);
      if (!hasVieMention(txt)) return false;
    }
    if (contract && contract !== "alternance" && contract !== "vie") {
      const txt = normalize(`${o.intitule ?? ""} ${o.description ?? ""} ${o.typeContrat ?? ""} ${o.typeContratLibelle ?? ""}`);
      if (!txt.includes(contract)) return false;
    }
    return true;
  });
}

function filterRecentOffers(offers: FtOffer[], maxAgeDays: number): FtOffer[] {
  if (!Number.isFinite(maxAgeDays) || maxAgeDays <= 0) return offers;
  const minTime = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  return offers.filter((o) => {
    if (!o.dateCreation) return false;
    const time = Date.parse(o.dateCreation);
    return Number.isFinite(time) && time >= minTime;
  });
}

function wantedContract(keywords: string[]): "alternance" | "stage" | "interim" | "cdi" | "cdd" | "vie" | null {
  if (keywords.some((k) => ["alternance", "apprentissage", "contrat pro", "professionnalisation", "professionalisation"].includes(k))) return "alternance";
  if (keywords.some((k) => ["stage", "stagiaire"].includes(k))) return "stage";
  if (keywords.some((k) => ["interim", "interimaire"].includes(k))) return "interim";
  if (keywords.some((k) => ["vie", "volontariat international"].includes(k))) return "vie";
  if (keywords.includes("cdi")) return "cdi";
  if (keywords.includes("cdd")) return "cdd";
  return null;
}

function isAlternanceProfile(p: ProfileRow): boolean {
  return wantedContract(parseJsonArr(p.keywords).map(normalize)) === "alternance";
}

function hasVieMention(text: string): boolean {
  return text.includes("volontariat international") || /\bvie\b/.test(text);
}

function titleMatches(intitule: string, titre: string): boolean {
  if (intitule.includes(titre)) return true;
  const titleWords = titre.split(/\s+/).map(stem).filter((w) => w.length > 2);
  if (titleWords.includes("pmo") && intitule.split(/\s+/).map(stem).includes("pmo")) return true;
  const words = new Set(intitule.split(/\s+/).map(stem).filter((w) => w.length > 2));
  return titleWords.every((w) => words.has(w));
}

function stem(word: string): string {
  return word.replace(/[es]$/, "");
}

export interface PollResult {
  profile: ProfileRow;
  offers: FtOffer[];
}

export async function runProfile(
  ft: FtClient,
  lba: LbaClient | null,
  adzuna: AdzunaClient | null,
  careerjet: CareerjetClient | null,
  smartrecruiters: SmartRecruitersClient | null,
  lever: LeverClient | null,
  greenhouse: GreenhouseClient | null,
  db: Database.Database,
  p: ProfileRow,
  excludedHosts: string[],
  maxAgeDays = 7,
): Promise<FtOffer[]> {
  const seen = new Map<string, FtOffer>();
  for (const q of buildQueries(p)) {
    try {
      for (const o of await ft.search(q)) seen.set(offerSeenKey(o), o);
    } catch (err) {
      console.error(`[poll] profile ${p.id} query failed:`, (err as Error).message);
    }
  }
  for (const q of buildLbaQueries(p)) {
    if (!lba) break;
    try {
      for (const o of await lba.search(q)) seen.set(offerSeenKey(o), o);
    } catch (err) {
      console.error(`[poll] profile ${p.id} LBA query failed:`, (err as Error).message);
    }
  }
  for (const q of buildAdzunaQueries(p)) {
    if (!adzuna) break;
    try {
      for (const o of await adzuna.search(q)) seen.set(offerSeenKey(o), o);
    } catch (err) {
      console.error(`[poll] profile ${p.id} Adzuna query failed:`, (err as Error).message);
    }
  }
  for (const q of buildCareerjetQueries(p)) {
    if (!careerjet) break;
    try {
      for (const o of await careerjet.search(q)) seen.set(offerSeenKey(o), o);
    } catch (err) {
      console.error(`[poll] profile ${p.id} Careerjet query failed:`, (err as Error).message);
    }
  }
  // Sources ATS (tous contrats, cache 10 min côté client) : le ciblage
  // titre/contrat/dédup est entièrement délégué à postFilter + seen_offers.
  if (smartrecruiters) {
    try {
      for (const o of await smartrecruiters.search()) seen.set(offerSeenKey(o), o);
    } catch (err) {
      console.error(`[poll] profile ${p.id} SmartRecruiters query failed:`, (err as Error).message);
    }
  }
  if (lever) {
    try {
      for (const o of await lever.search()) seen.set(offerSeenKey(o), o);
    } catch (err) {
      console.error(`[poll] profile ${p.id} Lever query failed:`, (err as Error).message);
    }
  }
  if (greenhouse) {
    try {
      for (const o of await greenhouse.search()) seen.set(offerSeenKey(o), o);
    } catch (err) {
      console.error(`[poll] profile ${p.id} Greenhouse query failed:`, (err as Error).message);
    }
  }
  return filterRecentOffers(postFilter([...seen.values()], p, excludedHosts), maxAgeDays).filter(
    (o) => !hasSeen(db, p.id, offerSeenKey(o)) && !hasSeen(db, p.id, o.id),
  );
}

export function offerSeenKey(o: FtOffer): string {
  const fp = [
    o.intitule,
    o.entreprise?.nom,
    o.lieuTravail?.libelle,
  ].map((v) => normalize(v ?? "")).join("|");
  if (fp.replace(/\|/g, "")) return `fp:${fp}`;
  const url = offerOriginUrl(o);
  if (url) return `url:${normalize(url)}`;
  return `id:${o.id}`;
}

// Poste un lot d'offres fraîches : notify sur la première postée, markSeen
// (clé fingerprint + id source) après chaque envoi réussi. Retourne le nombre posté.
export async function postFreshOffers(
  db: Database.Database,
  p: ProfileRow,
  offers: FtOffer[],
  post: (p: ProfileRow, o: FtOffer, notify: boolean) => Promise<void>,
): Promise<number> {
  let posted = 0;
  for (const o of offers) {
    try {
      await post(p, o, posted === 0);
      markSeen(db, p.id, offerSeenKey(o));
      markSeen(db, p.id, o.id);
      posted += 1;
    } catch (err) {
      if (isMissingDiscordChannel(err)) {
        deleteProfile(db, p.id);
        console.warn(`[poll] profile ${p.id} deleted: channel ${p.discord_channel_id} not found`);
        break;
      }
      console.error(`[poll] post failed (profile ${p.id}, offer ${o.id}):`, (err as Error).message);
    }
  }
  return posted;
}

export async function pollAll(
  ft: FtClient,
  lba: LbaClient | null,
  adzuna: AdzunaClient | null,
  careerjet: CareerjetClient | null,
  smartrecruiters: SmartRecruitersClient | null,
  lever: LeverClient | null,
  greenhouse: GreenhouseClient | null,
  db: Database.Database,
  cfg: Config,
  post: (p: ProfileRow, o: FtOffer, notify: boolean) => Promise<void>,
): Promise<void> {
  for (const p of listEnabledProfiles(db)) {
    const fresh = await runProfile(ft, lba, adzuna, careerjet, smartrecruiters, lever, greenhouse, db, p, cfg.excludedHosts, cfg.offerMaxAgeDays);
    await postFreshOffers(db, p, fresh, post);
    if (fresh.length) console.log(`[poll] profile ${p.id} (${p.label}): ${fresh.length} new offers`);
  }
}

function isMissingDiscordChannel(err: unknown): boolean {
  const e = err as { code?: unknown; message?: unknown };
  return e.code === 10003 || String(e.message ?? "").includes("Unknown Channel");
}
