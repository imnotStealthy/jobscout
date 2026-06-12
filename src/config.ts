export interface Config {
  ftClientId: string;
  ftClientSecret: string;
  discordBotToken: string;
  discordAppId: string;
  discordGuildId?: string;
  corsAllowedOrigins: string[];
  excludedHosts: string[];
  seenRetentionDays: number;
  pollCron: string;
  apiPort: number;
}

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export function loadConfig(): Config {
  return {
    ftClientId: required("FT_CLIENT_ID"),
    ftClientSecret: required("FT_CLIENT_SECRET"),
    discordBotToken: required("DISCORD_BOT_TOKEN"),
    discordAppId: required("DISCORD_APP_ID"),
    discordGuildId: process.env.DISCORD_GUILD_ID || undefined,
    corsAllowedOrigins: (process.env.CORS_ALLOWED_ORIGINS ?? "")
      .split(",").map((s) => s.trim()).filter(Boolean),
    excludedHosts: (process.env.EXCLUDED_HOSTS ?? "linkedin.com,indeed")
      .split(",").map((s) => s.trim()).filter(Boolean),
    seenRetentionDays: Number(process.env.SEEN_RETENTION_DAYS ?? 30),
    pollCron: process.env.POLL_CRON ?? "*/30 * * * *",
    apiPort: Number(process.env.API_PORT ?? 8787),
  };
}
