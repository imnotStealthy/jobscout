import {
  ChatInputCommandInteraction,
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";
import type Database from "better-sqlite3";
import type { Config } from "../config.js";
import { FtClient, FtOffer, FtSearchParams } from "../ftClient.js";
import { getProfile, listProfiles, ProfileRow, markSeen } from "../db.js";
import { runProfile, postFilter } from "../poller.js";
import { offerEmbed } from "./embed.js";
import { csv, sane, toJsonArr } from "./commands.js";

export function createBot(cfg: Config, db: Database.Database, ft: FtClient): Client {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.on("interactionCreate", async (i) => {
    if (!i.isChatInputCommand()) return;
    try {
      if (i.commandName === "profile") await handleProfile(i, cfg, db, ft, client);
      else if (i.commandName === "jobs") await handleJobs(i, cfg, ft);
    } catch (err) {
      console.error("[discord] command error:", (err as Error).message);
      const msg = { content: "Erreur interne.", ephemeral: true };
      if (i.deferred || i.replied) await i.followUp(msg).catch(() => {});
      else await i.reply(msg).catch(() => {});
    }
  });

  client.once("ready", () => console.log(`[discord] logged in as ${client.user?.tag}`));
  return client;
}

export async function postOffer(client: Client, p: ProfileRow, o: FtOffer): Promise<void> {
  const ch = await client.channels.fetch(p.discord_channel_id);
  if (!ch || !(ch instanceof TextChannel)) throw new Error(`channel ${p.discord_channel_id} invalid`);
  await ch.send({ embeds: [offerEmbed(o)] });
}

async function handleProfile(
  i: ChatInputCommandInteraction, cfg: Config, db: Database.Database, ft: FtClient, client: Client,
): Promise<void> {
  if (!i.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await i.reply({ content: "Réservé aux admins.", ephemeral: true });
    return;
  }
  const sub = i.options.getSubcommand();

  if (sub === "add") {
    const strs = ["label", "titres", "keywords", "rome", "communes", "dept", "region", "contrat"];
    for (const k of strs) {
      if (!sane(i.options.getString(k))) {
        await i.reply({ content: `Paramètre invalide: ${k}`, ephemeral: true });
        return;
      }
    }
    const tt = i.options.getString("teletravail");
    const res = db.prepare(`
      INSERT INTO profiles (label, discord_channel_id, titres, keywords, rome_codes,
        communes, departements, regions, rayon_km, teletravail, type_contrat)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      i.options.getString("label", true),
      i.options.getChannel("channel", true).id,
      toJsonArr(i.options.getString("titres", true)) ?? "[]",
      toJsonArr(i.options.getString("keywords", true)) ?? "[]",
      toJsonArr(i.options.getString("rome")),
      toJsonArr(i.options.getString("communes")),
      toJsonArr(i.options.getString("dept")),
      toJsonArr(i.options.getString("region")),
      i.options.getInteger("rayon"),
      tt === null ? null : tt === "oui" ? 1 : 0,
      toJsonArr(i.options.getString("contrat")),
    );
    await i.reply({ content: `Profil #${res.lastInsertRowid} créé.`, ephemeral: true });

  } else if (sub === "edit") {
    const id = i.options.getInteger("id", true);
    if (!getProfile(db, id)) {
      await i.reply({ content: `Profil #${id} introuvable.`, ephemeral: true });
      return;
    }
    const sets: string[] = [];
    const vals: unknown[] = [];
    const map: Record<string, string> = {
      label: "label", titres: "titres", keywords: "keywords", rome: "rome_codes",
      communes: "communes", dept: "departements", region: "regions", contrat: "type_contrat",
    };
    for (const [opt, col] of Object.entries(map)) {
      const v = i.options.getString(opt);
      if (v === null) continue;
      if (!sane(v)) {
        await i.reply({ content: `Paramètre invalide: ${opt}`, ephemeral: true });
        return;
      }
      sets.push(`${col} = ?`);
      vals.push(opt === "label" ? v : toJsonArr(v));
    }
    const channel = i.options.getChannel("channel");
    if (channel) { sets.push("discord_channel_id = ?"); vals.push(channel.id); }
    const rayon = i.options.getInteger("rayon");
    if (rayon !== null) { sets.push("rayon_km = ?"); vals.push(rayon); }
    const tt = i.options.getString("teletravail");
    if (tt !== null) { sets.push("teletravail = ?"); vals.push(tt === "oui" ? 1 : 0); }
    const enabled = i.options.getBoolean("enabled");
    if (enabled !== null) { sets.push("enabled = ?"); vals.push(enabled ? 1 : 0); }
    if (!sets.length) {
      await i.reply({ content: "Rien à modifier.", ephemeral: true });
      return;
    }
    db.prepare(`UPDATE profiles SET ${sets.join(", ")} WHERE id = ?`).run(...vals, id);
    await i.reply({ content: `Profil #${id} mis à jour.`, ephemeral: true });

  } else if (sub === "list") {
    const rows = listProfiles(db);
    const lines = rows.map((p) =>
      `#${p.id} ${p.enabled ? "✅" : "⏸️"} **${p.label}** → <#${p.discord_channel_id}> | titres: ${p.titres}`);
    await i.reply({ content: lines.join("\n") || "Aucun profil.", ephemeral: true });

  } else if (sub === "remove") {
    const id = i.options.getInteger("id", true);
    const res = db.prepare("DELETE FROM profiles WHERE id = ?").run(id);
    await i.reply({ content: res.changes ? `Profil #${id} supprimé.` : `Profil #${id} introuvable.`, ephemeral: true });

  } else if (sub === "test") {
    const id = i.options.getInteger("id", true);
    const p = getProfile(db, id);
    if (!p) {
      await i.reply({ content: `Profil #${id} introuvable.`, ephemeral: true });
      return;
    }
    await i.deferReply({ ephemeral: true });
    const fresh = await runProfile(ft, db, p, cfg.excludedHosts);
    for (const o of fresh) {
      await postOffer(client, p, o);
      markSeen(db, p.id, o.id);
    }
    await i.editReply(`Pipeline exécuté : ${fresh.length} offre(s) postée(s).`);
  }
}

async function handleJobs(i: ChatInputCommandInteraction, cfg: Config, ft: FtClient): Promise<void> {
  const q = i.options.getString("q", true);
  const lieu = i.options.getString("lieu");
  const titre = i.options.getString("titre");
  if (!sane(q) || !sane(lieu) || !sane(titre)) {
    await i.reply({ content: "Paramètre invalide.", ephemeral: true });
    return;
  }
  await i.deferReply({ ephemeral: true });

  const params: FtSearchParams = { motsCles: csv(q).join(",") };
  if (lieu) {
    if (/^\d{5}$/.test(lieu)) {
      params.commune = lieu;
      const rayon = i.options.getInteger("rayon");
      if (rayon !== null) params.distance = rayon;
    } else if (/^\d{1,3}$/.test(lieu)) {
      params.departement = lieu;
    }
  }
  const offers = await ft.search(params);
  const fakeProfile = {
    titres: toJsonArr(titre) ?? "[]", teletravail: null,
  } as Parameters<typeof postFilter>[1];
  const kept = postFilter(offers, fakeProfile, cfg.excludedHosts).slice(0, 5);
  if (!kept.length) {
    await i.editReply("Aucune offre trouvée.");
    return;
  }
  await i.editReply({ embeds: kept.map(offerEmbed) });
}
