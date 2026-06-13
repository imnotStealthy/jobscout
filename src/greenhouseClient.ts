import { AtsClient, fetchAtsJson } from "./atsClient.js";
import type { FtOffer } from "./ftClient.js";
import { contractLibelle, detectContractLabel } from "./atsContract.js";

// API publique Greenhouse Job Board (vérifiée 2026-06-12) :
// GET https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true
// -> { jobs: [{ id, title, absolute_url, updated_at, location{name}, content }] }
// absolute_url = job-boards.greenhouse.io — ATS officiel.
export interface GreenhouseJob {
  id: number | string;
  title?: string;
  absolute_url?: string;
  updated_at?: string;
  location?: { name?: string };
  content?: string;
}

const BASE_URL = "https://boards-api.greenhouse.io/v1/boards";
// Les boards Greenhouse sont mondiaux : on ne garde que la France.
const FR_LOCATION = /france|paris|lyon|bordeaux|nantes|lille|toulouse|marseille|rennes|strasbourg|grenoble|montpellier|nice/i;

export function isFranceLocation(name: string | undefined): boolean {
  return FR_LOCATION.test(name ?? "");
}

// content est du HTML encodé en entités -> texte brut minimal pour le match titre.
function plainText(html: string | undefined): string | undefined {
  if (!html) return undefined;
  const decoded = html
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
  return decoded.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 4000) || undefined;
}

export function ghToFtOffer(job: GreenhouseJob, companySlug: string): FtOffer | null {
  if (!job.absolute_url) return null; // URL d'origine obligatoire
  const description = plainText(job.content);
  const detected = detectContractLabel(`${job.title ?? ""}`);
  return {
    id: `greenhouse:${job.id}`,
    intitule: job.title ?? "Offre",
    description,
    dateCreation: job.updated_at,
    lieuTravail: { libelle: job.location?.name },
    entreprise: { nom: companySlug },
    typeContrat: "GREENHOUSE",
    typeContratLibelle: contractLibelle(undefined, detected),
    origineOffre: { urlOrigine: job.absolute_url },
  };
}

export function createGreenhouseClient(companies: string[]): AtsClient {
  return new AtsClient("Greenhouse", companies, async (slug) => {
    const data = await fetchAtsJson(`Greenhouse ${slug}`,
      `${BASE_URL}/${slug}/jobs?content=true`) as { jobs?: GreenhouseJob[] };
    return (data.jobs ?? [])
      .filter((j) => isFranceLocation(j.location?.name))
      .map((j) => ghToFtOffer(j, slug))
      .filter((o): o is FtOffer => o !== null);
  });
}
