import {
  ChannelType,
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder,
} from "discord.js";
import type { Config } from "../config.js";

const csv = (s: string | null): string[] =>
  (s ?? "").split(",").map((x) => x.trim()).filter(Boolean).slice(0, 20);

export const toJsonArr = (s: string | null): string | null => {
  const arr = csv(s);
  return arr.length ? JSON.stringify(arr) : null;
};

// Validation basique : longueur + charset raisonnable
export function sane(s: string | null, max = 200): boolean {
  if (s === null) return true;
  return s.length <= max && !/[\x00-\x1f]/.test(s);
}

export function buildCommands() {
  const profile = new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Gérer les profils de recherche (admin)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((s) =>
      s.setName("add").setDescription("Ajouter un profil")
        .addStringOption((o) => o.setName("label").setDescription("Nom du profil").setRequired(true))
        .addChannelOption((o) => o.setName("channel").setDescription("Salon cible").addChannelTypes(ChannelType.GuildText).setRequired(true))
        .addStringOption((o) => o.setName("titres").setDescription("Titres de poste (csv)").setRequired(true))
        .addStringOption((o) => o.setName("keywords").setDescription("Mots-clés (csv)").setRequired(true))
        .addStringOption((o) => o.setName("rome").setDescription("Codes ROME (csv)"))
        .addStringOption((o) => o.setName("communes").setDescription("Codes INSEE (csv)"))
        .addIntegerOption((o) => o.setName("rayon").setDescription("Rayon km").setMinValue(0).setMaxValue(200))
        .addStringOption((o) => o.setName("dept").setDescription("Départements (csv)"))
        .addStringOption((o) => o.setName("region").setDescription("Régions (csv)"))
        .addStringOption((o) => o.setName("teletravail").setDescription("oui|non").addChoices({ name: "oui", value: "oui" }, { name: "non", value: "non" }))
        .addStringOption((o) => o.setName("contrat").setDescription("Types de contrat (csv, ex CDI,CDD)")))
    .addSubcommand((s) =>
      s.setName("edit").setDescription("Modifier un profil")
        .addIntegerOption((o) => o.setName("id").setDescription("ID profil").setRequired(true))
        .addChannelOption((o) => o.setName("channel").setDescription("Salon cible").addChannelTypes(ChannelType.GuildText))
        .addStringOption((o) => o.setName("label").setDescription("Nom"))
        .addStringOption((o) => o.setName("titres").setDescription("Titres (csv)"))
        .addStringOption((o) => o.setName("keywords").setDescription("Mots-clés (csv)"))
        .addStringOption((o) => o.setName("rome").setDescription("Codes ROME (csv)"))
        .addStringOption((o) => o.setName("communes").setDescription("Codes INSEE (csv)"))
        .addIntegerOption((o) => o.setName("rayon").setDescription("Rayon km").setMinValue(0).setMaxValue(200))
        .addStringOption((o) => o.setName("dept").setDescription("Départements (csv)"))
        .addStringOption((o) => o.setName("region").setDescription("Régions (csv)"))
        .addStringOption((o) => o.setName("teletravail").setDescription("oui|non").addChoices({ name: "oui", value: "oui" }, { name: "non", value: "non" }))
        .addStringOption((o) => o.setName("contrat").setDescription("Types de contrat (csv)"))
        .addBooleanOption((o) => o.setName("enabled").setDescription("Actif")))
    .addSubcommand((s) => s.setName("list").setDescription("Lister les profils"))
    .addSubcommand((s) =>
      s.setName("remove").setDescription("Supprimer un profil")
        .addIntegerOption((o) => o.setName("id").setDescription("ID profil").setRequired(true)))
    .addSubcommand((s) =>
      s.setName("test").setDescription("Exécuter le pipeline immédiatement")
        .addIntegerOption((o) => o.setName("id").setDescription("ID profil").setRequired(true)));

  const jobs = new SlashCommandBuilder()
    .setName("jobs")
    .setDescription("Recherche d'offres ad hoc")
    .addStringOption((o) => o.setName("q").setDescription("Mots-clés").setRequired(true))
    .addStringOption((o) => o.setName("lieu").setDescription("Code INSEE commune ou n° département"))
    .addIntegerOption((o) => o.setName("rayon").setDescription("Rayon km").setMinValue(0).setMaxValue(200))
    .addStringOption((o) => o.setName("titre").setDescription("Titres (csv)"));

  return [profile.toJSON(), jobs.toJSON()];
}

export async function registerCommands(cfg: Config): Promise<void> {
  const rest = new REST().setToken(cfg.discordBotToken);
  const body = buildCommands();
  if (cfg.discordGuildId) {
    await rest.put(Routes.applicationGuildCommands(cfg.discordAppId, cfg.discordGuildId), { body });
  } else {
    await rest.put(Routes.applicationCommands(cfg.discordAppId), { body });
  }
  console.log("[discord] slash commands registered");
}

export { csv };
