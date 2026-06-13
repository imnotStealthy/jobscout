import { AtsClient, fetchAtsJson } from "./atsClient.js";
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

export function createLeverClient(companies: string[]): AtsClient {
  return new AtsClient("Lever", companies, async (slug) => {
    const data = await fetchAtsJson(`Lever ${slug}`, `${BASE_URL}/${slug}?mode=json`) as LeverPosting[];
    return data
      .filter((p) => (p.country ?? "").toUpperCase() === "FR")
      .map((p) => leverToFtOffer(p, slug))
      .filter((o): o is FtOffer => o !== null);
  });
}
