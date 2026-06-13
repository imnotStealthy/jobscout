import { AtsClient, fetchAtsJson, isFranceLocation } from "./atsClient.js";
import type { FtOffer } from "./ftClient.js";
import { contractLibelle, detectContractLabel } from "./atsContract.js";

// API publique Ashby Job Board (vérifiée 2026-06-13) :
// GET https://api.ashbyhq.com/posting-api/job-board/{slug}?includeCompensation=true
// -> { jobs: [{ id, title, employmentType, location, secondaryLocations:[{location}],
//      publishedAt, workplaceType, jobUrl, applyUrl }] }
// jobUrl = jobs.ashbyhq.com — page offre officielle. Boards mondiaux -> filtre FR.
export interface AshbyJob {
  id: string;
  title?: string;
  employmentType?: string;
  location?: string;
  secondaryLocations?: { location?: string }[];
  publishedAt?: string;
  jobUrl?: string;
  applyUrl?: string;
}

const BASE_URL = "https://api.ashbyhq.com/posting-api/job-board";

function locations(job: AshbyJob): string {
  return [job.location, ...(job.secondaryLocations ?? []).map((s) => s.location)]
    .filter(Boolean).join(", ");
}

export function isFranceAshby(job: AshbyJob): boolean {
  return isFranceLocation(job.location) ||
    (job.secondaryLocations ?? []).some((s) => isFranceLocation(s.location));
}

export function ashbyToFtOffer(job: AshbyJob, companySlug: string): FtOffer | null {
  const url = job.jobUrl ?? job.applyUrl;
  if (!url) return null; // URL d'origine obligatoire
  const detected = detectContractLabel(`${job.title ?? ""} ${job.employmentType ?? ""}`);
  return {
    id: `ashby:${job.id}`,
    intitule: job.title ?? "Offre",
    dateCreation: job.publishedAt,
    lieuTravail: { libelle: locations(job) || undefined },
    entreprise: { nom: companySlug },
    typeContrat: "ASHBY",
    typeContratLibelle: contractLibelle(job.employmentType, detected),
    origineOffre: { urlOrigine: url },
  };
}

export function createAshbyClient(companies: string[]): AtsClient {
  return new AtsClient("Ashby", companies, async (slug) => {
    const data = await fetchAtsJson(`Ashby ${slug}`,
      `${BASE_URL}/${slug}?includeCompensation=true`) as { jobs?: AshbyJob[] };
    return (data.jobs ?? [])
      .filter(isFranceAshby)
      .map((j) => ashbyToFtOffer(j, slug))
      .filter((o): o is FtOffer => o !== null);
  });
}
