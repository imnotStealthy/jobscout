import type { FtOffer } from "./ftClient.js";

export const ATS_USER_AGENT = "JobSearcherBot/0.1";
const CACHE_TTL_MS = 10 * 60 * 1000; // un poll multi-profils ne refetch pas chaque société

// GET JSON depuis une API ATS publique. Le label sert au message d'erreur
// ("SmartRecruiters Wavestone1: HTTP 404").
export async function fetchAtsJson(label: string, url: string): Promise<unknown> {
  const res = await fetch(url, { headers: { "User-Agent": ATS_USER_AGENT } });
  if (!res.ok) throw new Error(`${label}: HTTP ${res.status}`);
  return res.json();
}

// Connecteur ATS générique : interroge chaque société une fois, cache par slug.
// La forme des offres et le filtrage sont délégués à `fetchCompany`.
export class AtsClient {
  private cache = new Map<string, { at: number; offers: FtOffer[] }>();

  constructor(
    readonly name: string,
    private companies: string[],
    private fetchCompany: (slug: string) => Promise<FtOffer[]>,
  ) {}

  async search(): Promise<FtOffer[]> {
    const all: FtOffer[] = [];
    for (const slug of this.companies) {
      const cached = this.cache.get(slug);
      if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
        all.push(...cached.offers);
        continue;
      }
      const offers = await this.fetchCompany(slug);
      this.cache.set(slug, { at: Date.now(), offers });
      all.push(...offers);
    }
    return all;
  }
}
