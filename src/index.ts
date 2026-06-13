import cron from "node-cron";
import { serve } from "@hono/node-server";
import { loadConfig } from "./config.js";
import { openDb, purgeSeen } from "./db.js";
import { AdzunaClient } from "./adzunaClient.js";
import { AtsClient } from "./atsClient.js";
import { CareerjetClient } from "./careerjetClient.js";
import { FtClient } from "./ftClient.js";
import { createGreenhouseClient } from "./greenhouseClient.js";
import { LbaClient } from "./lbaClient.js";
import { createLeverClient } from "./leverClient.js";
import { createSmartRecruitersClient } from "./smartrecruitersClient.js";
import { pollAll } from "./poller.js";
import { createBot, postOffer } from "./discord/bot.js";
import { registerCommands } from "./discord/commands.js";
import { createApi } from "./api/server.js";
import { acquireInstanceLock, assertPortAvailable } from "./singleInstance.js";

async function main(): Promise<void> {
  const cfg = loadConfig();
  const lock = acquireInstanceLock();
  if (!lock) {
    console.error("[jobscout] another instance is already running. Stop it before starting a new one.");
    process.exit(0);
  }

  process.once("exit", lock.release);
  process.once("SIGINT", () => {
    lock.release();
    process.exit(130);
  });
  process.once("SIGTERM", () => {
    lock.release();
    process.exit(143);
  });

  try {
    await assertPortAvailable(cfg.apiPort);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "EADDRINUSE") {
      console.error(`[api] port ${cfg.apiPort} is already in use. Stop the running Job Searcher instance first.`);
      process.exit(1);
    }
    throw err;
  }

  const db = openDb();
  const ft = new FtClient(cfg);
  const lba = cfg.lbaApiToken ? new LbaClient(cfg.lbaApiToken) : null;
  const adzuna = cfg.adzunaAppId && cfg.adzunaAppKey ? new AdzunaClient(cfg.adzunaAppId, cfg.adzunaAppKey) : null;
  const careerjet = cfg.careerjetApiKey ? new CareerjetClient(cfg) : null;
  // Sources ATS actives (slug listés en config) ; nouvelle source = une entrée ici.
  const ats: AtsClient[] = [];
  if (cfg.smartrecruitersCompanies.length) ats.push(createSmartRecruitersClient(cfg.smartrecruitersCompanies));
  if (cfg.leverCompanies.length) ats.push(createLeverClient(cfg.leverCompanies));
  if (cfg.greenhouseCompanies.length) ats.push(createGreenhouseClient(cfg.greenhouseCompanies));

  await registerCommands(cfg);
  const client = createBot(cfg, db, ft, lba, adzuna, careerjet, ats);
  await client.login(cfg.discordBotToken);

  const api = createApi(cfg, ft);
  serve({ fetch: api.fetch, port: cfg.apiPort }, (info) =>
    console.log(`[api] listening on :${info.port}`));

  let polling = false;
  const runPoll = async () => {
    if (polling) return;
    polling = true;
    try {
      await pollAll(ft, lba, adzuna, careerjet, ats, db, cfg, (p, o, notify) => postOffer(client, p, o, notify));
    } catch (err) {
      console.error("[poll] run failed:", (err as Error).message);
    } finally {
      polling = false;
    }
  };
  setInterval(runPoll, cfg.pollIntervalMs);
  // setInterval ne déclenche pas de tick initial : sans ce premier run, un bot
  // (re)démarré ne poste rien avant pollIntervalMs (jusqu'à 7j). Dédup via seen_offers.
  void runPoll();

  cron.schedule("0 4 * * *", () => {
    const n = purgeSeen(db, cfg.seenRetentionDays);
    console.log(`[purge] removed ${n} seen_offers rows`);
  });

  console.log(`[jobscout] started — poll interval: ${cfg.pollIntervalLabel}`);
}

main().catch((err) => {
  console.error("fatal:", err);
  process.exit(1);
});
