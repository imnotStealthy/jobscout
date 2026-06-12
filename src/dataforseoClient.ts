import type { Config } from "./config.js";
import type { FtOffer } from "./ftClient.js";
import { isExcludedHost, isTrustedHost, safeHost } from "./hostFilter.js";

export type HostRules = Pick<Config, "excludedHosts" | "trustedHosts">;

// Filtre strict réservé à Google Jobs / DataForSEO : URL + host obligatoires,
// host ni exclu, ni hors allowlist. Les autres sources ne passent PAS par ici.
export function isTrustedGoogleJobsUrl(url: string | null | undefined, cfg: HostRules): boolean {
  const host = safeHost(url);
  if (!host) return false;
  if (isExcludedHost(host, cfg.excludedHosts)) return false;
  return isTrustedHost(host, cfg.trustedHosts);
}

// assumption: structure item DataForSEO SERP Google Jobs (advanced) — champs
// optionnels, à confirmer sur la doc officielle au 1er run avec creds réels.
export interface DataforseoJobItem {
  title?: string;
  employer_name?: string;
  location?: string;
  contract_type?: string;
  timestamp?: string;
  description?: string;
  job_apply_link?: string;
  apply_options?: { source?: string; url?: string }[];
}

export interface DataforseoSearchParams {
  keyword: string;
}

// Première apply option fiable, sinon null (l'URL Google Jobs intermédiaire
// n'est jamais retenue : elle n'est pas dans l'allowlist).
export function pickTrustedApplyUrl(item: DataforseoJobItem, cfg: HostRules): string | null {
  const candidates = [
    ...(item.apply_options ?? []).map((o) => o.url),
    item.job_apply_link,
  ];
  for (const url of candidates) {
    if (url && isTrustedGoogleJobsUrl(url, cfg)) return url;
  }
  return null;
}

// FtOffer ou null si aucune URL fiable -> l'offre n'entre jamais dans le pipeline.
export function toFtOffer(item: DataforseoJobItem, cfg: HostRules): FtOffer | null {
  const url = pickTrustedApplyUrl(item, cfg);
  if (!url) return null;
  return {
    id: `dataforseo:${url}`,
    intitule: item.title ?? "Offre Google Jobs",
    description: item.description,
    dateCreation: item.timestamp,
    lieuTravail: { libelle: item.location },
    entreprise: { nom: item.employer_name },
    typeContrat: "DATAFORSEO",
    typeContratLibelle: item.contract_type,
    origineOffre: { urlOrigine: url },
  };
}

const TASK_POST_URL = "https://api.dataforseo.com/v3/serp/google/jobs/task_post";
const taskGetUrl = (id: string) => `https://api.dataforseo.com/v3/serp/google/jobs/task_get/advanced/${id}`;

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

interface DataforseoTaskResponse {
  tasks?: {
    id?: string;
    status_code?: number;
    result?: { items?: DataforseoJobItem[] }[] | null;
  }[];
}

export class DataforseoClient {
  private throttle = new Throttle(12);

  constructor(
    private login: string,
    private password: string,
    private hostRules: HostRules,
  ) {}

  private authHeader(): string {
    return `Basic ${Buffer.from(`${this.login}:${this.password}`).toString("base64")}`;
  }

  // Google Jobs DataForSEO est en mode task : POST puis polling du résultat.
  async search(params: DataforseoSearchParams): Promise<FtOffer[]> {
    await this.throttle.wait();
    const postRes = await fetch(TASK_POST_URL, {
      method: "POST",
      headers: { Authorization: this.authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify([{
        keyword: params.keyword,
        location_name: "France",
        language_code: "fr",
        depth: 50,
      }]),
    });
    if (!postRes.ok) throw new Error(`DataForSEO task_post error: HTTP ${postRes.status}`);
    const posted = (await postRes.json()) as DataforseoTaskResponse;
    const taskId = posted.tasks?.[0]?.id;
    if (!taskId) throw new Error("DataForSEO task_post: no task id");

    for (let attempt = 0; attempt < 10; attempt += 1) {
      await new Promise((r) => setTimeout(r, 3000));
      const getRes = await fetch(taskGetUrl(taskId), {
        headers: { Authorization: this.authHeader() },
      });
      if (!getRes.ok) throw new Error(`DataForSEO task_get error: HTTP ${getRes.status}`);
      const data = (await getRes.json()) as DataforseoTaskResponse;
      const task = data.tasks?.[0];
      if (task?.status_code === 20000 && task.result) {
        const items = task.result.flatMap((r) => r.items ?? []);
        return items
          .map((item) => toFtOffer(item, this.hostRules))
          .filter((o): o is FtOffer => o !== null);
      }
    }
    throw new Error("DataForSEO task_get: timeout waiting for result");
  }
}
