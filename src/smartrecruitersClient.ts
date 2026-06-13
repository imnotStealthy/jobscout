import { AtsClient, fetchAtsJson } from "./atsClient.js";
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

export function createSmartRecruitersClient(companies: string[]): AtsClient {
  return new AtsClient("SmartRecruiters", companies, async (slug) => {
    const data = await fetchAtsJson(`SmartRecruiters ${slug}`,
      `${BASE_URL}/${slug}/postings?country=fr&limit=100`) as { content?: SmartRecruitersPosting[] };
    return (data.content ?? []).map((p) => srToFtOffer(p, slug));
  });
}
