import type { Config } from "./config.js";
import type { FtOffer } from "./ftClient.js";

export interface CareerjetSearchParams {
  keywords?: string;
  location?: string;
  radius?: number;
  contractType?: "p" | "c" | "t" | "i" | "v";
}

interface CareerjetJob {
  title?: string;
  company?: string;
  date?: string;
  description?: string;
  locations?: string;
  site?: string;
  url?: string;
}

interface CareerjetSearchResponse {
  type?: "JOBS" | "LOCATIONS";
  jobs?: CareerjetJob[];
  message?: string;
}

const SEARCH_URL = "https://search.api.careerjet.net/v4/query";

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

export class CareerjetClient {
  private throttle = new Throttle(60);

  constructor(private cfg: Pick<Config, "careerjetApiKey" | "careerjetUserIp" | "careerjetUserAgent" | "careerjetReferer">) {}

  async search(params: CareerjetSearchParams): Promise<FtOffer[]> {
    if (!this.cfg.careerjetApiKey) return [];
    await this.throttle.wait();

    const qs = new URLSearchParams({
      locale_code: "fr_FR",
      page_size: "50",
      sort: "date",
      user_ip: this.cfg.careerjetUserIp,
      user_agent: this.cfg.careerjetUserAgent,
    });
    if (params.keywords) qs.set("keywords", params.keywords);
    if (params.location) qs.set("location", params.location);
    if (params.radius != null) qs.set("radius", String(params.radius));
    if (params.contractType) qs.set("contract_type", params.contractType);

    const credentials = Buffer.from(`${this.cfg.careerjetApiKey}:`).toString("base64");
    const headers: Record<string, string> = { Authorization: `Basic ${credentials}` };
    if (this.cfg.careerjetReferer) headers.Referer = this.cfg.careerjetReferer;
    const res = await fetch(`${SEARCH_URL}?${qs}`, {
      headers,
    });
    if (!res.ok) throw new Error(`Careerjet search error: HTTP ${res.status}`);

    const data = (await res.json()) as CareerjetSearchResponse;
    if (data.type === "LOCATIONS") return [];
    return (data.jobs ?? []).map(toFtOffer);
  }
}

function toFtOffer(job: CareerjetJob): FtOffer {
  const date = job.date ? new Date(job.date) : null;
  return {
    id: `careerjet:${job.url ?? `${job.title}:${job.company}:${job.locations}`}`,
    intitule: job.title ?? "Offre Careerjet",
    description: job.description,
    dateCreation: date && Number.isFinite(date.getTime()) ? date.toISOString() : job.date,
    lieuTravail: { libelle: job.locations },
    entreprise: { nom: job.company },
    typeContrat: "CAREERJET",
    typeContratLibelle: "Careerjet",
    origineOffre: { urlOrigine: job.url },
  };
}
