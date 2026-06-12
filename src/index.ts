import cron from "node-cron";
import { serve } from "@hono/node-server";
import { loadConfig } from "./config.js";
import { openDb, purgeSeen } from "./db.js";
import { FtClient } from "./ftClient.js";
import { pollAll } from "./poller.js";
import { createBot, postOffer } from "./discord/bot.js";
import { registerCommands } from "./discord/commands.js";
import { createApi } from "./api/server.js";

async function main(): Promise<void> {
  const cfg = loadConfig();
  const db = openDb();
  const ft = new FtClient(cfg);

  await registerCommands(cfg);
  const client = createBot(cfg, db, ft);
  await client.login(cfg.discordBotToken);

  const api = createApi(cfg, ft);
  serve({ fetch: api.fetch, port: cfg.apiPort }, (info) =>
    console.log(`[api] listening on :${info.port}`));

  let polling = false;
  cron.schedule(cfg.pollCron, async () => {
    if (polling) return;
    polling = true;
    try {
      await pollAll(ft, db, cfg, (p, o) => postOffer(client, p, o));
    } catch (err) {
      console.error("[poll] run failed:", (err as Error).message);
    } finally {
      polling = false;
    }
  });

  cron.schedule("0 4 * * *", () => {
    const n = purgeSeen(db, cfg.seenRetentionDays);
    console.log(`[purge] removed ${n} seen_offers rows`);
  });

  console.log(`[jobscout] started — poll cron: ${cfg.pollCron}`);
}

main().catch((err) => {
  console.error("fatal:", err);
  process.exit(1);
});
