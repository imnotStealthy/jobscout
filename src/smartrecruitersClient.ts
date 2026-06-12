import type { FtOffer } from "./ftClient.js";
import { contractLibelle, detectContractLabel } from "./atsContract.js";

// API publique SmartRecruiters (vérifiée 2026-06-12) :
// GET https://api.smartrecruiters.com/v1/companies/{slug}/postings?country=fr
// -> { totalFound, content: [{ id, uuid, name, releasedDate, company{identifier,name},
//      location{city,country}, typeOfEmployment{id,label} }] }
export interface SmartRecruitersPosting {
  id: string;
  uuid?: string;
  name?: string;
  releasedDate?: string;
  company?: { identifier?: string; name?: string };
  location?: { city?: string; region?: string; country?: string; fullLocation?: string };
  typeOfEmployment?: { id?: string; label?: string };
}

const BASE_URL = "https://api.smartrecruiters.com/v1/companies";
const CACHE_TTL_MS = 10 * 60 * 1000; // un poll multi-profils ne refetch pas chaque société

export function srToFtOffer(p: SmartRecruitersPosting, companySlug: string): FtOffer {
  const detected = detectContractLabel(`${p.name ?? ""} ${p.typeOfEmployment?.id ?? ""} ${p.typeOfEmployment?.label ?? ""}`);
  return {
    id: `smartrecruiters:${p.uuid ?? `${companySlug}:${p.id}`}`,
    intitule: p.name ?? "Offre",
    dateCreation: p.releasedDate,
    lieuTravail: { libelle: p.location?.fullLocation ?? p.location?.city },
    entreprise: { nom: p.company?.name ?? companySlug },
    typeContrat: "SMARTRECRUITERS",
    typeContratLibelle: contractLibelle(p.typeOfEmployment?.label, detected),
    // Page offre publique sur l'ATS officiel (host jobs.smartrecruiters.com)
    origineOffre: { urlOrigine: `https://jobs.smartrecruiters.com/${p.company?.identifier ?? companySlug}/${p.id}` },
  };
}

export class SmartRecruitersClient {
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
      const res = await fetch(`${BASE_URL}/${slug}/postings?country=fr&limit=100`, {
        headers: { "User-Agent": "JobSearcherBot/0.1" },
      });
      if (!res.ok) throw new Error(`SmartRecruiters ${slug}: HTTP ${res.status}`);
      const data = (await res.json()) as { content?: SmartRecruitersPosting[] };
      const offers = (data.content ?? []).map((p) => srToFtOffer(p, slug));
      this.cache.set(slug, { at: Date.now(), offers });
      all.push(...offers);
    }
    return all;
  }
}
