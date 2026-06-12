import type { Config } from "./config.js";

// assumption: champs FT v2 — à confirmer sur le Swagger officiel au 1er run
export interface FtOffer {
  id: string;
  intitule: string;
  description?: string;
  dateCreation?: string;
  lieuTravail?: { libelle?: string };
  entreprise?: { nom?: string };
  typeContrat?: string;
  typeContratLibelle?: string;
  origineOffre?: { urlOrigine?: string; partenaires?: { url?: string }[] };
  urlPostulation?: string;
}

export interface FtSearchParams {
  motsCles?: string;
  codeROME?: string;
  appellation?: string;
  commune?: string;
  distance?: number;
  departement?: string;
  region?: string;
  typeContrat?: string;
}

const TOKEN_URL =
  "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire";
const SEARCH_URL =
  "https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search";
const SCOPE = "api_offresdemploiv2 o2dsoffre";

// Token bucket simple : ~4 req/s (assumption quota FT)
class Throttle {
  private last = 0;
  private readonly minIntervalMs: number;
  constructor(reqPerSec: number) { this.minIntervalMs = 1000 / reqPerSec; }
  async wait(): Promise<void> {
    const now = Date.now();
    const delay = Math.max(0, this.last + this.minIntervalMs - now);
    this.last = now + delay;
    if (delay > 0) await new Promise((r) => setTimeout(r, delay));
  }
}

export class FtClient {
  private token: string | null = null;
  private tokenExpiresAt = 0;
  private throttle = new Throttle(4);

  constructor(private cfg: Pick<Config, "ftClientId" | "ftClientSecret">) {}

  private async getToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiresAt) return this.token;
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.cfg.ftClientId,
      client_secret: this.cfg.ftClientSecret,
      scope: SCOPE,
    });
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) throw new Error(`FT token error: HTTP ${res.status}`);
    const data = (await res.json()) as { access_token: string; expires_in: number };
    this.token = data.access_token;
    this.tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000; // marge 60s
    return this.token;
  }

  async search(params: FtSearchParams, range = "0-49"): Promise<FtOffer[]> {
    await this.throttle.wait();
    const token = await this.getToken();
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
    }
    qs.set("range", range);
    const res = await fetch(`${SEARCH_URL}?${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 204) return [];
    if (!res.ok) throw new Error(`FT search error: HTTP ${res.status}`);
    const data = (await res.json()) as { resultats?: FtOffer[] };
    return data.resultats ?? [];
  }
}

export function offerOriginUrl(o: FtOffer): string | null {
  return o.origineOffre?.urlOrigine ?? o.urlPostulation ?? null;
}
