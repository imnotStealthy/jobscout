import type { FtOffer } from "./ftClient.js";

export interface LbaSearchParams {
  romes?: string;
  departements?: string[];
  radius?: number;
}

interface LbaJob {
  identifier: {
    id: string | null;
    partner_job_id: string;
    partner_label: string;
  };
  workplace: {
    name: string | null;
    location?: { address?: string };
  };
  apply: {
    url: string;
  };
  contract: {
    duration: number | null;
    type: string[];
  };
  offer: {
    title: string;
    description: string;
    publication: { creation: string | null };
  };
}

interface LbaSearchResponse {
  jobs?: LbaJob[];
}

const SEARCH_URL = "https://api.apprentissage.beta.gouv.fr/api/job/v1/search";

class Throttle {
  private last = 0;
  private readonly minIntervalMs: number;
  constructor(reqPerMinute: number) { this.minIntervalMs = 60_000 / reqPerMinute; }
  async wait(): Promise<void> {
    const now = Date.now();
    const delay = Math.max(0, this.last + this.minIntervalMs - now);
    this.last = now + delay;
    if (delay > 0) await new Promise((r) => setTimeout(r, delay));
  }
}

export class LbaClient {
  private throttle = new Throttle(60);

  constructor(private token: string) {}

  async search(params: LbaSearchParams): Promise<FtOffer[]> {
    await this.throttle.wait();
    const qs = new URLSearchParams();
    if (params.romes) qs.set("romes", params.romes);
    if (params.radius != null) qs.set("radius", String(params.radius));
    for (const dept of params.departements ?? []) qs.append("departements", dept);

    const res = await fetch(`${SEARCH_URL}?${qs}`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!res.ok) throw new Error(`LBA search error: HTTP ${res.status}`);
    const data = (await res.json()) as LbaSearchResponse;
    return (data.jobs ?? []).map(toFtOffer);
  }
}

function toFtOffer(job: LbaJob): FtOffer {
  const id = job.identifier.id ?? job.identifier.partner_job_id;
  const duration = job.contract.duration ? ` - ${job.contract.duration} mois` : "";
  return {
    id: `lba:${job.identifier.partner_label}:${id}`,
    intitule: job.offer.title,
    description: job.offer.description,
    dateCreation: job.offer.publication.creation ?? undefined,
    lieuTravail: { libelle: job.workplace.location?.address },
    entreprise: { nom: job.workplace.name ?? undefined },
    typeContrat: "LBA",
    typeContratLibelle: `${job.contract.type.join(", ")}${duration}`,
    origineOffre: { urlOrigine: job.apply.url },
  };
}
