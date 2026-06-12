import type { FtOffer } from "./ftClient.js";
import { contractLibelle, detectContractLabel } from "./atsContract.js";

// API publique Lever (vérifiée 2026-06-12) :
// GET https://api.lever.co/v0/postings/{slug}?mode=json
// -> [{ id, text, createdAt(ms), country, categories{commitment,location},
//       hostedUrl, applyUrl, descriptionPlain }]
export interface LeverPosting {
  id: string;
  text?: string;
  createdAt?: number;
  country?: string;
  categories?: { commitment?: string; location?: string; team?: string };
  hostedUrl?: string;
  applyUrl?: string;
  descriptionPlain?: string;
}

const BASE_URL = "https://api.lever.co/v0/postings";
const CACHE_TTL_MS = 10 * 60 * 1000;

export function leverToFtOffer(p: LeverPosting, companySlug: string): FtOffer | null {
  if (!p.hostedUrl) return null; // URL d'origine obligatoire
  const detected = detectContractLabel(`${p.text ?? ""} ${p.categories?.commitment ?? ""}`);
  return {
    id: `lever:${p.id}`,
    intitule: p.text ?? "Offre",
    description: p.descriptionPlain,
    dateCreation: p.createdAt ? new Date(p.createdAt).toISOString() : undefined,
    lieuTravail: { libelle: p.categories?.location },
    entreprise: { nom: companySlug },
    typeContrat: "LEVER",
    typeContratLibelle: contractLibelle(p.categories?.commitment, detected),
    origineOffre: { urlOrigine: p.hostedUrl }, // jobs.lever.co — ATS officiel
  };
}

export class LeverClient {
  private cache = new Map<string, { at: number; offers: FtOffer[] }>();

  constructor(private companies: string[]) {}

  async search(): Promise<FtOffer[]> {
    const all: FtOffer[] = [];
    for (const slug of this.companies) {
      const cached = this.cache.get(slug);
      if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
        all.push(...cached.offers);
        continue;
      }
      const res = await fetch(`${BASE_URL}/${slug}?mode=json`, {
        headers: { "User-Agent": "JobSearcherBot/0.1" },
      });
      if (!res.ok) throw new Error(`Lever ${slug}: HTTP ${res.status}`);
      const data = (await res.json()) as LeverPosting[];
      const offers = data
        .filter((p) => (p.country ?? "").toUpperCase() === "FR")
        .map((p) => leverToFtOffer(p, slug))
        .filter((o): o is FtOffer => o !== null);
      this.cache.set(slug, { at: Date.now(), offers });
      all.push(...offers);
    }
    return all;
  }
}
