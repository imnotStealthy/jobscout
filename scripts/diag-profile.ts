// Diagnostic hors Discord : pourquoi un profil poste 0 offre.
// Usage: node --env-file=.env --import tsx scripts/diag-profile.ts <profileId>
import { loadConfig } from "../src/config.js";
import { openDb, getProfile, hasSeen } from "../src/db.js";
import { FtClient, FtOffer, offerOriginUrl } from "../src/ftClient.js";
import { AdzunaClient } from "../src/adzunaClient.js";
import { CareerjetClient } from "../src/careerjetClient.js";
import { LbaClient } from "../src/lbaClient.js";
import {
  buildQueries, buildLbaQueries, buildAdzunaQueries, buildCareerjetQueries,
  postFilter, offerSeenKey,
} from "../src/poller.js";
import { isExcludedHost, normalize, safeHost } from "../src/hostFilter.js";

const id = Number(process.argv[2] ?? 8);
const cfg = loadConfig();
const db = openDb();
const p = getProfile(db, id);
if (!p) { console.error(`profile ${id} not found`); process.exit(1); }

console.log("=== PROFIL ===");
console.log({ id: p.id, label: p.label, titres: p.titres, keywords: p.keywords,
  communes: p.communes, departements: p.departements, regions: p.regions,
  rayon_km: p.rayon_km, type_contrat: p.type_contrat, teletravail: p.teletravail });

const ft = new FtClient(cfg);
const lba = cfg.lbaApiToken ? new LbaClient(cfg.lbaApiToken) : null;
const adzuna = cfg.adzunaAppId && cfg.adzunaAppKey ? new AdzunaClient(cfg.adzunaAppId, cfg.adzunaAppKey) : null;
const careerjet = cfg.careerjetApiKey ? new CareerjetClient(cfg) : null;

function sample(offers: FtOffer[], n = 3) {
  return offers.slice(0, n).map((o) => ({
    titre: o.intitule, entreprise: o.entreprise?.nom, lieu: o.lieuTravail?.libelle,
    contrat: o.typeContratLibelle ?? o.typeContrat, date: o.dateCreation?.slice(0, 10),
    source: o.id.split(":")[0] === o.id ? "FT" : o.id.split(":")[0],
  }));
}

function rejectReasons(offers: FtOffer[], maxAgeDays: number) {
  const titres = (JSON.parse(p!.titres) as string[]).map(normalize).filter(Boolean);
  const reasons: Record<string, number> = {};
  const bump = (r: string) => { reasons[r] = (reasons[r] ?? 0) + 1; };
  const minTime = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  for (const o of offers) {
    const host = safeHost(offerOriginUrl(o));
    if (isExcludedHost(host, cfg.excludedHosts)) { bump(host ? `host exclu (${host})` : "URL absente/invalide"); continue; }
    const kept = postFilter([o], p!, cfg.excludedHosts).length > 0;
    if (!kept) {
      const intitule = normalize(o.intitule ?? "");
      if (titres.length && !titres.some((t) => intitule.includes(t))) bump(`titre non matché [ex: "${o.intitule}"]`);
      else bump("filtre contrat/teletravail");
      continue;
    }
    if (!o.dateCreation || !(Date.parse(o.dateCreation) >= minTime)) { bump(`trop ancienne/sans date (${o.dateCreation?.slice(0,10) ?? "n/a"})`); continue; }
    if (hasSeen(db, p!.id, offerSeenKey(o)) || hasSeen(db, p!.id, o.id)) { bump("déjà vue (seen_offers)"); continue; }
    bump("OK -> serait postée");
  }
  return reasons;
}

async function runSource(name: string, queries: object[], exec: (q: never) => Promise<FtOffer[]>) {
  console.log(`\n=== ${name} — ${queries.length} requête(s) ===`);
  const all = new Map<string, FtOffer>();
  for (const q of queries) {
    console.log("query:", JSON.stringify(q));
    try {
      const res = await exec(q as never);
      console.log(`  -> ${res.length} bruts`);
      for (const o of res) all.set(offerSeenKey(o), o);
    } catch (err) {
      console.log(`  -> ERREUR: ${(err as Error).message}`);
    }
  }
  const offers = [...all.values()];
  console.log(`bruts dédupliqués: ${offers.length}`);
  console.log("exemples:", JSON.stringify(sample(offers), null, 1));
  const kept = postFilter(offers, p!, cfg.excludedHosts);
  console.log(`après postFilter: ${kept.length}`);
  console.log("raisons:", JSON.stringify(rejectReasons(offers, cfg.offerMaxAgeDays), null, 1));
  return offers;
}

const ftQ = buildQueries(p);
const lbaQ = buildLbaQueries(p);
const adzQ = buildAdzunaQueries(p);
const cjQ = buildCareerjetQueries(p);

await runSource("France Travail", ftQ, (q) => ft.search(q));
if (lba && lbaQ.length) await runSource("LBA", lbaQ, (q) => lba.search(q));
else console.log(`\n=== LBA — skip (${lba ? "profil non-alternance" : "pas de token"}) ===`);
if (adzuna && adzQ.length) await runSource("Adzuna", adzQ, (q) => adzuna.search(q));
else console.log(`\n=== Adzuna — skip (${adzuna ? "profil alternance" : "pas de creds"}) ===`);
if (careerjet && cjQ.length) await runSource("Careerjet", cjQ, (q) => careerjet.search(q));
else console.log(`\n=== Careerjet — skip (${careerjet ? "profil alternance" : "pas de clé"}) ===`);

const seenRows = db.prepare("SELECT COUNT(*) n FROM seen_offers WHERE profile_id = ?").get(id) as { n: number };
console.log(`\nseen_offers pour profil ${id}: ${seenRows.n} ligne(s)`);
