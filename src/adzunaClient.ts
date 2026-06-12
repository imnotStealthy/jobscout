import type { FtOffer } from "./ftClient.js";

export interface AdzunaSearchParams {
  what?: string;
  where?: string;
  distance?: number;
  permanent?: boolean;
}

interface AdzunaJob {
  id: string;
  title: string;
  description?: string;
  created?: string;
  redirect_url?: string;
  location?: { display_name?: string };
  company?: { display_name?: string };
  contract_type?: string;
  contract_time?: string;
}

interface AdzunaSearchResponse {
  results?: AdzunaJob[];
}

const BASE_URL = "https://api.adzuna.com/v1/api/jobs/fr/search/1";

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

export class AdzunaClient {
  private throttle = new Throttle(60);

  constructor(private appId: string, private appKey: string) {}

  async search(params: AdzunaSearchParams): Promise<FtOffer[]> {
    await this.throttle.wait();
    const qs = new URLSearchParams({
      app_id: this.appId,
      app_key: this.appKey,
      results_per_page: "50",
      "content-type": "application/json",
    });
    if (params.what) qs.set("what", params.what);
    if (params.where) qs.set("where", params.where);
    if (params.distance != null) qs.set("distance", String(params.distance));
    if (params.permanent) qs.set("permanent", "1");

    const res = await fetch(`${BASE_URL}?${qs}`);
    if (!res.ok) throw new Error(`Adzuna search error: HTTP ${res.status}`);
    const data = (await res.json()) as AdzunaSearchResponse;
    return (data.results ?? []).map(toFtOffer);
  }
}

function toFtOffer(job: AdzunaJob): FtOffer {
  return {
    id: `adzuna:${job.id}`,
    intitule: job.title,
    description: job.description,
    dateCreation: job.created,
    lieuTravail: { libelle: job.location?.display_name },
    entreprise: { nom: job.company?.display_name },
    typeContrat: "ADZUNA",
    typeContratLibelle: [job.contract_type, job.contract_time].filter(Boolean).join(" - ") || undefined,
    origineOffre: { urlOrigine: job.redirect_url },
  };
}
