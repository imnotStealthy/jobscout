export interface Config {
  ftClientId: string;
  ftClientSecret: string;
  lbaApiToken?: string;
  adzunaAppId?: string;
  adzunaAppKey?: string;
  careerjetApiKey?: string;
  dataforseoLogin?: string;
  dataforseoPassword?: string;
  trustedHosts: string[];
  careerjetUserIp: string;
  careerjetUserAgent: string;
  careerjetReferer?: string;
  discordBotToken: string;
  discordAppId: string;
  discordGuildId?: string;
  corsAllowedOrigins: string[];
  excludedHosts: string[];
  seenRetentionDays: number;
  offerMaxAgeDays: number;
  pollIntervalLabel: string;
  pollIntervalMs: number;
  apiPort: number;
}

// Allowlist par défaut pour les liens Google Jobs (ATS + jobboards officiels FR)
const DEFAULT_TRUSTED_HOSTS = [
  "greenhouse.io", "lever.co", "workable.com", "smartrecruiters.com",
  "ashbyhq.com", "teamtailor.com", "welcomekit.co", "flatchr.io",
  "talent-soft.com", "successfactors.eu", "myworkdayjobs.com", "icims.com",
  "recruitee.com", "breezy.hr",
  "francetravail.fr", "labonnealternance.apprentissage.beta.gouv.fr",
  "1jeune1solution.gouv.fr", "choisirleservicepublic.gouv.fr",
  "apec.fr", "hellowork.com", "meteojob.com", "regionsjob.com",
].join(",");

const DEFAULT_EXCLUDED_HOSTS = [
  "linkedin.com", "indeed", "glassdoor",
  "facebook.com", "x.com", "twitter.com", "tiktok.com", "instagram.com",
  "jooble", "jobrapido", "neuvoo",
].join(",");

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function parsePollInterval(raw: string): { label: string; ms: number } {
  const value = raw.trim().toLowerCase();
  const match = /^(\d+)([hd])$/.exec(value);
  if (!match) {
    throw new Error("Invalid POLL_CRON: use a delay like 5h, 7h, 1d, 2d, up to 7d");
  }
  const amount = Number(match[1]);
  const unit = match[2];
  const hours = unit === "h" ? amount : amount * 24;
  if (hours < 5) throw new Error("Invalid POLL_CRON: minimum delay is 5h");
  if (hours > 7 * 24) throw new Error("Invalid POLL_CRON: maximum delay is 7d");
  return { label: value, ms: hours * 60 * 60 * 1000 };
}

export function loadConfig(): Config {
  const pollInterval = parsePollInterval(process.env.POLL_CRON ?? "1d");
  return {
    ftClientId: required("FT_CLIENT_ID"),
    ftClientSecret: required("FT_CLIENT_SECRET"),
    lbaApiToken: process.env.LBA_API_TOKEN || undefined,
    adzunaAppId: process.env.ADZUNA_APP_ID || undefined,
    adzunaAppKey: process.env.ADZUNA_APP_KEY || undefined,
    careerjetApiKey: process.env.CAREERJET_API_KEY || undefined,
    dataforseoLogin: process.env.DATAFORSEO_LOGIN || undefined,
    dataforseoPassword: process.env.DATAFORSEO_PASSWORD || undefined,
    trustedHosts: (process.env.TRUSTED_HOSTS ?? DEFAULT_TRUSTED_HOSTS)
      .split(",").map((s) => s.trim()).filter(Boolean),
    careerjetUserIp: process.env.CAREERJET_USER_IP || "127.0.0.1",
    careerjetUserAgent: process.env.CAREERJET_USER_AGENT || "JobSearcherBot/0.1",
    careerjetReferer: process.env.CAREERJET_REFERER || undefined,
    discordBotToken: required("DISCORD_BOT_TOKEN"),
    discordAppId: required("DISCORD_APP_ID"),
    discordGuildId: process.env.DISCORD_GUILD_ID || undefined,
    corsAllowedOrigins: (process.env.CORS_ALLOWED_ORIGINS ?? "")
      .split(",").map((s) => s.trim()).filter(Boolean),
    excludedHosts: (process.env.EXCLUDED_HOSTS ?? DEFAULT_EXCLUDED_HOSTS)
      .split(",").map((s) => s.trim()).filter(Boolean),
    seenRetentionDays: Number(process.env.SEEN_RETENTION_DAYS ?? 30),
    offerMaxAgeDays: Number(process.env.OFFER_MAX_AGE_DAYS ?? 7),
    pollIntervalLabel: pollInterval.label,
    pollIntervalMs: pollInterval.ms,
    apiPort: Number(process.env.API_PORT ?? 8787),
  };
}
