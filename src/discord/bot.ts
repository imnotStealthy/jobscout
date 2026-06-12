import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  ChannelType,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  MessageFlags,
  ModalBuilder,
  ModalSubmitInteraction,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  TextChannel,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import type Database from "better-sqlite3";
import { existsSync } from "node:fs";
import type { Config } from "../config.js";
import { AdzunaClient } from "../adzunaClient.js";
import { CareerjetClient } from "../careerjetClient.js";
import { FtClient, FtOffer, FtSearchParams } from "../ftClient.js";
import { GreenhouseClient } from "../greenhouseClient.js";
import { LbaClient } from "../lbaClient.js";
import { LeverClient } from "../leverClient.js";
import { SmartRecruitersClient } from "../smartrecruitersClient.js";
import { deleteProfile, getProfile, listProfiles, ProfileRow } from "../db.js";
import { postFreshOffers, runProfile, postFilter } from "../poller.js";
import { offerEmbed } from "./embed.js";
import { csv, sane, toJsonArr } from "./commands.js";

const MAX_SEARCHES_PER_USER = 7;

export function createBot(
  cfg: Config,
  db: Database.Database,
  ft: FtClient,
  lba: LbaClient | null,
  adzuna: AdzunaClient | null,
  careerjet: CareerjetClient | null,
  smartrecruiters: SmartRecruitersClient | null,
  lever: LeverClient | null,
  greenhouse: GreenhouseClient | null,
): Client {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.on("interactionCreate", async (i) => {
    try {
      if (i.isChatInputCommand()) {
        if (i.commandName === "profile") await handleProfile(i, cfg, db, ft, lba, adzuna, careerjet, smartrecruiters, lever, greenhouse, client);
        else if (i.commandName === "jobs") await handleJobs(i, cfg, ft);
        else if (i.commandName === "setup") await handleSetup(i);
        else if (i.commandName === "generate") await handleGenerate(i);
      } else if (i.isButton() && i.customId.startsWith("jobscout:close-search:")) {
        await handleCloseSearch(i, db);
      } else if (i.isButton() && i.customId.startsWith("jobscout:create-search:")) {
        await showContractSelect(i);
      } else if (i.isStringSelectMenu() && i.customId.startsWith("jobscout:contract:")) {
        await showSearchModal(i);
      } else if (i.isModalSubmit() && i.customId.startsWith("jobscout:create-search-modal:")) {
        await handleSearchModal(i, cfg, db, ft, lba, adzuna, careerjet, smartrecruiters, lever, greenhouse, client);
      }
    } catch (err) {
      console.error("[discord] interaction error:", (err as Error).message);
      const msg = { content: "Erreur interne.", flags: MessageFlags.Ephemeral as const };
      if (!i.isRepliable()) return;
      if (i.deferred || i.replied) await i.followUp(msg).catch(() => {});
      else await i.reply(msg).catch(() => {});
    }
  });

  client.once("clientReady", () => console.log(`[discord] logged in as ${client.user?.tag}`));
  return client;
}

export async function postOffer(client: Client, p: ProfileRow, o: FtOffer, notify = false): Promise<void> {
  const ch = await client.channels.fetch(p.discord_channel_id);
  if (!ch || !(ch instanceof TextChannel)) throw new Error(`channel ${p.discord_channel_id} invalid`);
  const content = notify ? userMentionForChannel(ch, client) : undefined;
  await ch.send({ content, embeds: [offerEmbed(o)] });
}

function userMentionForChannel(ch: TextChannel, client: Client): string | undefined {
  const botId = client.user?.id;
  const overwrite = ch.permissionOverwrites.cache.find((o) =>
    o.type === 1 && o.id !== botId && o.allow.has(PermissionFlagsBits.ViewChannel));
  return overwrite ? `<@${overwrite.id}>` : undefined;
}

async function handleSetup(i: ChatInputCommandInteraction): Promise<void> {
  if (!i.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await i.reply({ content: "Réservé aux admins.", flags: MessageFlags.Ephemeral });
    return;
  }
  if (i.options.getSubcommand() !== "post") {
    await i.reply({ content: "Salon invalide.", flags: MessageFlags.Ephemeral });
    return;
  }
  const target = i.options.getChannel("channel") ?? i.channel;
  if (!(target instanceof TextChannel)) {
    await i.reply({ content: "Salon invalide.", flags: MessageFlags.Ephemeral });
    return;
  }
  const category = i.options.getChannel("category");
  const categoryId = category?.type === ChannelType.GuildCategory
    ? category.id
    : target.parentId ?? "current";

  const embed = new EmbedBuilder()
    .setTitle("Recherche d'emploi")
    .setDescription([
      "Crée ton salon privé pour recevoir les offres qui correspondent à ta recherche.",
      "",
      "Informations demandées : poste, contrat, localisation, rayon et mots-clés.",
    ].join("\n"))
    .setColor(0x2f6fed);
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`jobscout:create-search:${categoryId}`)
      .setLabel("Créer ma recherche")
      .setStyle(ButtonStyle.Primary),
  );

  await target.send({ embeds: [embed], components: [row] });
  await i.reply({
    content: `Message de création posté dans <#${target.id}>. Les salons privés seront créés ${categoryId === "current" ? "dans la catégorie du salon" : `dans <#${categoryId}>`}.`,
    flags: MessageFlags.Ephemeral,
  });
}

async function handleGenerate(i: ChatInputCommandInteraction): Promise<void> {
  if (!i.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await i.reply({ content: "Réservé aux admins.", flags: MessageFlags.Ephemeral });
    return;
  }
  if (i.options.getSubcommand() !== "info") {
    await i.reply({ content: "Génération inconnue.", flags: MessageFlags.Ephemeral });
    return;
  }

  const files = existsSync("logo.png")
    ? [new AttachmentBuilder("logo.png", { name: "logo.png" })]
    : [];
  const embed = new EmbedBuilder()
    .setTitle("🎯 Job Searcher — c'est quoi et pourquoi")
    .setDescription(
      "Trouver un job quand t'es étudiant, c'est un deuxième job. Scroller 15 onglets, recopier les mêmes recherches, tomber sur des offres mortes ou des murs de pub. J'ai voulu virer cette galère.",
    )
    .addFields(
      {
        name: "Qui je suis",
        value: [
          "Étudiant en gestion (BUT GEA), pas un parcours « tech » à la base.",
          "J'ai appris à construire des outils en autodidacte parce que j'en avais marre de perdre du temps.",
          "Ce bot, c'est exactement ça : un truc né d'un besoin réel, pas d'un cours.",
        ].join("\n"),
      },
      {
        name: "Ce que fait le bot",
        value: [
          "Tu donnes ton profil : titre de poste, localisation, mobilité et type de contrat.",
          "Il te ramène les offres qui collent : job étudiant, CDD, CDI, alternance, VIE.",
          "Pas de LinkedIn/Indeed, pas d'intermédiaire : tu cliques, t'es sur la vraie offre.",
        ].join("\n"),
      },
      {
        name: "Pourquoi c'est un bon point",
        value: [
          "• Tu reçois les offres dans ton salon, par profil, sans rien chercher.",
          "• Données officielles : API France Travail, La bonne alternance, liens directs, zéro pub.",
          "• Pensé pour ceux qui galèrent : étudiants, alternants, premiers emplois.",
        ].join("\n"),
      },
      {
        name: "Le fond du projet",
        value: "Je viens pas de la tech, et c'est justement le point : si moi j'ai pu le construire pour nous aider, c'est que l'outil sert vraiment à quelque chose de concret.",
      },
      {
        name: "Qui suis-je",
        value: "[Profil LinkedIn](https://www.linkedin.com/in/kizona-chy/)",
      },
    )
    .setColor(0x2f6fed)
    .setFooter({ text: "Job Searcher" });
  if (files.length) embed.setThumbnail("attachment://logo.png");

  await i.reply({ embeds: [embed], files });
}

async function showContractSelect(i: ButtonInteraction): Promise<void> {
  const categoryId = i.customId.split(":")[2] || "current";
  const select = new StringSelectMenuBuilder()
    .setCustomId(`jobscout:contract:${categoryId}`)
    .setPlaceholder("Choisis le type de contrat recherché")
    .addOptions(
      {
        label: "Alternance",
        description: "Apprentissage ou professionnalisation",
        value: "alternance",
      },
      { label: "CDI", value: "cdi" },
      { label: "CDD", value: "cdd" },
      { label: "Stage", description: "Avec durée demandée ensuite", value: "stage" },
      { label: "Intérim", value: "interim" },
      { label: "VIE", description: "Volontariat international en entreprise", value: "vie" },
    );
  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  await i.reply({
    content: "Choisis d'abord le type de contrat.",
    components: [row],
    flags: MessageFlags.Ephemeral,
  });
}

async function showSearchModal(i: StringSelectMenuInteraction): Promise<void> {
  const categoryId = i.customId.split(":")[2] || "current";
  const contractValue = i.values[0] ?? "alternance";
  const modal = new ModalBuilder()
    .setCustomId(`jobscout:create-search-modal:${categoryId}:${contractValue}`)
    .setTitle("Créer une recherche d'emploi");

  const job = new TextInputBuilder()
    .setCustomId("job")
    .setLabel("Poste recherche")
    .setPlaceholder("Exemple : PMO, comptable, data analyst")
    .setStyle(TextInputStyle.Short)
    .setMaxLength(120)
    .setRequired(true);
  const location = new TextInputBuilder()
    .setCustomId("location")
    .setLabel("Localisation")
    .setPlaceholder("Exemple : 91, 91000, IDF")
    .setStyle(TextInputStyle.Short)
    .setMaxLength(120)
    .setRequired(true);
  const radius = new TextInputBuilder()
    .setCustomId("radius")
    .setLabel("Rayon en km")
    .setPlaceholder("Exemple : 25")
    .setStyle(TextInputStyle.Short)
    .setMaxLength(3)
    .setRequired(false);
  const keywords = new TextInputBuilder()
    .setCustomId("keywords")
    .setLabel("Mots-clés complémentaires")
    .setPlaceholder("Exemple : junior, assistant, finance")
    .setStyle(TextInputStyle.Paragraph)
    .setMaxLength(200)
    .setRequired(false);

  const components = [
    new ActionRowBuilder<TextInputBuilder>().addComponents(job),
    new ActionRowBuilder<TextInputBuilder>().addComponents(location),
    new ActionRowBuilder<TextInputBuilder>().addComponents(radius),
    new ActionRowBuilder<TextInputBuilder>().addComponents(keywords),
  ];

  if (contractValue === "alternance") {
    components.push(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("cadence")
          .setLabel("Rythme d'alternance")
          .setPlaceholder("Exemple : 3 semaines entreprise / 1 semaine école")
          .setStyle(TextInputStyle.Short)
          .setMaxLength(100)
          .setRequired(true),
      ),
    );
  } else if (contractValue === "stage") {
    components.push(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("duration")
          .setLabel("Durée du stage")
          .setPlaceholder("Exemple : 6 mois")
          .setStyle(TextInputStyle.Short)
          .setMaxLength(60)
          .setRequired(true),
      ),
    );
  }

  modal.addComponents(
    ...components,
  );
  await i.showModal(modal);
}

async function handleSearchModal(
  i: ModalSubmitInteraction,
  cfg: Config,
  db: Database.Database,
  ft: FtClient,
  lba: LbaClient | null,
  adzuna: AdzunaClient | null,
  careerjet: CareerjetClient | null,
  smartrecruiters: SmartRecruitersClient | null,
  lever: LeverClient | null,
  greenhouse: GreenhouseClient | null,
  client: Client,
): Promise<void> {
  if (!i.guild) {
    await i.reply({ content: "Commande disponible uniquement sur un serveur.", flags: MessageFlags.Ephemeral });
    return;
  }
  const botId = i.guild.members.me?.id ?? client.user?.id;
  if (!botId || !i.guild.members.me?.permissions.has(PermissionFlagsBits.ManageChannels)) {
    await i.reply({ content: "Le bot n'a pas la permission Manage Channels.", flags: MessageFlags.Ephemeral });
    return;
  }

  const job = i.fields.getTextInputValue("job").trim();
  const contractInput = i.customId.split(":")[3] ?? "";
  const location = i.fields.getTextInputValue("location").trim();
  const radiusInput = i.fields.getTextInputValue("radius").trim();
  const extraKeywords = i.fields.getTextInputValue("keywords").trim();
  const extraDetail = readContractDetail(i, contractInput);
  if (!sane(job, 120) || !sane(location, 120) || !sane(extraKeywords, 200) || !sane(extraDetail, 100)) {
    await i.reply({ content: "Un champ contient une valeur invalide.", flags: MessageFlags.Ephemeral });
    return;
  }

  const contract = parseContract(contractInput);
  if (!contract) {
    await i.reply({ content: "Contrat invalide. Valeurs: CDI, CDD, alternance, stage, intérim, VIE.", flags: MessageFlags.Ephemeral });
    return;
  }
  if ((contractInput === "alternance" || contractInput === "stage") && !extraDetail) {
    await i.reply({ content: "Le champ complémentaire est obligatoire pour ce contrat.", flags: MessageFlags.Ephemeral });
    return;
  }
  const radius = parseRadius(radiusInput);
  if (radius === undefined) {
    await i.reply({ content: "Rayon invalide. Utilise un nombre entre 0 et 200.", flags: MessageFlags.Ephemeral });
    return;
  }

  // Tout ce qui suit (fetch salons, création, recherche instantanée) dépasse les 3 s
  // accordées avant réponse -> on défère tout de suite en éphémère.
  await i.deferReply({ flags: MessageFlags.Ephemeral });

  const loc = parseLocation(location);
  const categoryId = i.customId.split(":")[2] || "current";
  const parent = categoryId === "current"
    ? i.channel instanceof TextChannel ? i.channel.parentId ?? undefined : undefined
    : categoryId;
  const activeSearches = await countUserSearches(db, client, i.user.id);
  if (activeSearches >= MAX_SEARCHES_PER_USER) {
    await i.editReply(`Tu as déjà ${MAX_SEARCHES_PER_USER} recherches actives. Ferme une recherche avant d'en créer une nouvelle pour éviter de saturer les API.`);
    return;
  }
  const channel = await i.guild.channels.create({
    name: channelName(contract.label, job, i.user.id),
    type: ChannelType.GuildText,
    parent,
    topic: `Recherche ${contract.label} - ${job} - ${location}`,
    permissionOverwrites: [
      { id: i.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
      {
        id: i.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
      {
        id: botId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.EmbedLinks,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
    ],
  });

  const keywords = [...csv(job), ...contract.keywords, ...csv(extraKeywords)];
  const result = db.prepare(`
    INSERT INTO profiles (label, discord_channel_id, titres, keywords, rome_codes,
      communes, departements, regions, rayon_km, teletravail, type_contrat)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `${contract.label} - ${job}`.slice(0, 120),
    channel.id,
    toJsonArr(job) ?? "[]",
    JSON.stringify([...new Set(keywords)].slice(0, 20)),
    null,
    loc.commune,
    loc.departement,
    loc.region,
    radius ?? null,
    null,
    contract.typeContrats.length ? JSON.stringify(contract.typeContrats) : null,
  );

  const created = new EmbedBuilder()
    .setTitle(`Recherche créée #${result.lastInsertRowid}`)
    .setDescription("Ce salon recevra les nouvelles offres correspondant à ton profil.")
    .addFields(
      { name: "Poste", value: job, inline: true },
      { name: "Contrat", value: contract.label, inline: true },
      { name: "Localisation", value: location, inline: true },
    )
    .setColor(0x2f6fed);
  if (extraDetail) {
    created.addFields({
      name: contract.label === "Stage" ? "Durée" : "Rythme",
      value: extraDetail,
      inline: true,
    });
  }
  const closeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`jobscout:close-search:${result.lastInsertRowid}`)
      .setLabel("Fermer cette recherche")
      .setStyle(ButtonStyle.Danger),
  );
  await channel.send({ content: `<@${i.user.id}>`, embeds: [created], components: [closeRow] });

  // Recherche instantanée : même pipeline que le poll (runProfile route déjà
  // alternance -> FT+LBA, autres contrats -> FT+Adzuna+Careerjet).
  const profileId = Number(result.lastInsertRowid);
  const profile = getProfile(db, profileId);
  let summary = `Recherche créée : <#${channel.id}>`;
  if (profile) {
    await channel.send("Recherche instantanée en cours...").catch(() => {});
    try {
      const fresh = await runProfile(ft, lba, adzuna, careerjet, smartrecruiters, lever, greenhouse, db, profile, cfg.excludedHosts, cfg.offerMaxAgeDays);
      const posted = await postFreshOffers(db, profile, fresh, (pp, o, notify) => postOffer(client, pp, o, notify));
      if (posted > 0) {
        summary = `Recherche créée : <#${channel.id}> — ${posted} offre(s) postée(s).`;
      } else {
        await channel.send("Aucune offre trouvée maintenant. Ce salon reste actif et recevra les nouvelles offres automatiquement.").catch(() => {});
        summary = `Recherche créée : <#${channel.id}> — aucune offre maintenant, surveillance active.`;
      }
    } catch (err) {
      console.error(`[instant-search] profile ${profileId} failed:`, (err as Error).message);
      summary = `Recherche créée : <#${channel.id}> — la recherche instantanée a rencontré un souci, le suivi automatique reste actif.`;
    }
  }
  await i.editReply(summary);
}

async function countUserSearches(db: Database.Database, client: Client, userId: string): Promise<number> {
  const profiles = listProfiles(db);
  let count = 0;
  for (const p of profiles) {
    try {
      const ch = await client.channels.fetch(p.discord_channel_id);
      if (!(ch instanceof TextChannel)) continue;
      const overwrite = ch.permissionOverwrites.cache.get(userId);
      if (overwrite?.allow.has(PermissionFlagsBits.ViewChannel)) count += 1;
    } catch (err) {
      if (!isMissingDiscordChannel(err)) throw err;
      deleteProfile(db, p.id);
    }
  }
  return count;
}

async function handleCloseSearch(i: ButtonInteraction, db: Database.Database): Promise<void> {
  if (!(i.channel instanceof TextChannel)) {
    await i.reply({ content: "Salon invalide.", flags: MessageFlags.Ephemeral });
    return;
  }
  const profileId = Number(i.customId.split(":")[2]);
  const p = Number.isFinite(profileId) ? getProfile(db, profileId) : undefined;
  if (!p || p.discord_channel_id !== i.channel.id) {
    await i.reply({ content: "Recherche introuvable ou déjà supprimée.", flags: MessageFlags.Ephemeral });
    return;
  }

  const allowed = i.memberPermissions?.has(PermissionFlagsBits.Administrator) ||
    i.channel.permissionOverwrites.cache.get(i.user.id)?.allow.has(PermissionFlagsBits.ViewChannel);
  if (!allowed) {
    await i.reply({ content: "Tu ne peux pas fermer cette recherche.", flags: MessageFlags.Ephemeral });
    return;
  }

  await i.reply({ content: "Recherche fermée. Nettoyage du salon...", flags: MessageFlags.Ephemeral });
  deleteProfile(db, p.id);
  await i.channel.delete("Job Searcher search closed by user");
}

function readContractDetail(i: ModalSubmitInteraction, contractInput: string): string {
  if (contractInput === "alternance") return i.fields.getTextInputValue("cadence").trim();
  if (contractInput === "stage") return i.fields.getTextInputValue("duration").trim();
  return "";
}

function parseRadius(input: string): number | null | undefined {
  if (!input) return null;
  if (!/^\d{1,3}$/.test(input)) return undefined;
  const radius = Number(input);
  return radius >= 0 && radius <= 200 ? radius : undefined;
}

function parseLocation(input: string): { commune: string | null; departement: string | null; region: string | null } {
  const dept = postalCodeDepartment(input);
  if (dept) return { commune: null, departement: JSON.stringify([dept]), region: null };
  if (/^\d{5}(,\s*\d{5})*$/.test(input)) return { commune: toJsonArr(input), departement: null, region: null };
  if (/^\d{1,3}(,\s*\d{1,3})*$/.test(input)) return { commune: null, departement: toJsonArr(input), region: null };
  return { commune: null, departement: null, region: JSON.stringify(csv(input).map(regionCode)) };
}

function postalCodeDepartment(value: string): string | null {
  if (!/^\d{5}$/.test(value) || !value.endsWith("000")) return null;
  return value.startsWith("97") || value.startsWith("98") ? value.slice(0, 3) : value.slice(0, 2);
}

function regionCode(value: string): string {
  const v = value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s_-]/g, "");
  const map: Record<string, string> = {
    idf: "11",
    iledefrance: "11",
  };
  return map[v] ?? value;
}

function parseContract(input: string): { label: string; typeContrats: string[]; keywords: string[] } | null {
  const v = input.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s_-]/g, "");
  if (v === "cdi") return { label: "CDI", typeContrats: ["CDI"], keywords: ["CDI"] };
  if (v === "cdd") return { label: "CDD", typeContrats: ["CDD"], keywords: ["CDD"] };
  if (["alternance", "apprentissage", "contratpro", "professionnalisation", "professionalisation"].includes(v)) {
    return {
      label: "Alternance",
      typeContrats: [],
      keywords: ["alternance", "apprentissage", "contrat pro", "professionnalisation", "professionalisation"],
    };
  }
  if (["stage", "stagiaire"].includes(v)) {
    return { label: "Stage", typeContrats: [], keywords: ["stage", "stagiaire"] };
  }
  if (["interim", "interimaire"].includes(v)) {
    return { label: "Intérim", typeContrats: [], keywords: ["interim", "interimaire"] };
  }
  if (["vie", "volontariatinternational", "volontariatinternationalenentreprise"].includes(v)) {
    return { label: "VIE", typeContrats: [], keywords: ["VIE", "volontariat international"] };
  }
  return null;
}

function channelName(contract: string, job: string, userId: string): string {
  const raw = `job-${contract}-${job}-${userId.slice(-4)}`;
  return raw.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 90) || `job-${userId.slice(-4)}`;
}

async function pruneMissingChannels(
  db: Database.Database,
  client: Client,
  profiles: ProfileRow[],
): Promise<{ kept: ProfileRow[]; deleted: number }> {
  const kept: ProfileRow[] = [];
  let deleted = 0;
  for (const p of profiles) {
    try {
      const ch = await client.channels.fetch(p.discord_channel_id);
      if (ch) {
        kept.push(p);
        continue;
      }
    } catch (err) {
      if (!isMissingDiscordChannel(err)) throw err;
    }
    deleteProfile(db, p.id);
    deleted += 1;
  }
  return { kept, deleted };
}

function isMissingDiscordChannel(err: unknown): boolean {
  const e = err as { code?: unknown; message?: unknown };
  return e.code === 10003 || String(e.message ?? "").includes("Unknown Channel");
}

async function handleProfile(
  i: ChatInputCommandInteraction,
  cfg: Config,
  db: Database.Database,
  ft: FtClient,
  lba: LbaClient | null,
  adzuna: AdzunaClient | null,
  careerjet: CareerjetClient | null,
  smartrecruiters: SmartRecruitersClient | null,
  lever: LeverClient | null,
  greenhouse: GreenhouseClient | null,
  client: Client,
): Promise<void> {
  if (!i.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await i.reply({ content: "Réservé aux admins.", flags: MessageFlags.Ephemeral });
    return;
  }
  const sub = i.options.getSubcommand();

  if (sub === "add") {
    const strs = ["label", "titres", "keywords", "rome", "communes", "dept", "region", "contrat"];
    for (const k of strs) {
      if (!sane(i.options.getString(k))) {
        await i.reply({ content: `Paramètre invalide: ${k}`, flags: MessageFlags.Ephemeral });
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
    await i.reply({ content: `Profil #${res.lastInsertRowid} créé.`, flags: MessageFlags.Ephemeral });

  } else if (sub === "edit") {
    const id = i.options.getInteger("id", true);
    if (!getProfile(db, id)) {
      await i.reply({ content: `Profil #${id} introuvable.`, flags: MessageFlags.Ephemeral });
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
        await i.reply({ content: `Paramètre invalide: ${opt}`, flags: MessageFlags.Ephemeral });
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
      await i.reply({ content: "Rien à modifier.", flags: MessageFlags.Ephemeral });
      return;
    }
    db.prepare(`UPDATE profiles SET ${sets.join(", ")} WHERE id = ?`).run(...vals, id);
    await i.reply({ content: `Profil #${id} mis à jour.`, flags: MessageFlags.Ephemeral });

  } else if (sub === "list") {
    await i.deferReply({ flags: MessageFlags.Ephemeral });
    const { kept, deleted } = await pruneMissingChannels(db, client, listProfiles(db));
    const lines = kept.map((p) =>
      `#${p.id} ${p.enabled ? "actif" : "pause"} **${p.label}** -> <#${p.discord_channel_id}> | titres: ${p.titres}`);
    const suffix = deleted ? `\n\n${deleted} profil(s) supprimé(s), salon introuvable.` : "";
    await i.editReply((lines.join("\n") || "Aucun profil.") + suffix);

  } else if (sub === "remove") {
    const id = i.options.getInteger("id", true);
    const res = db.prepare("DELETE FROM profiles WHERE id = ?").run(id);
    await i.reply({ content: res.changes ? `Profil #${id} supprimé.` : `Profil #${id} introuvable.`, flags: MessageFlags.Ephemeral });

  } else if (sub === "test") {
    const id = i.options.getInteger("id", true);
    const p = getProfile(db, id);
    if (!p) {
      await i.reply({ content: `Profil #${id} introuvable.`, flags: MessageFlags.Ephemeral });
      return;
    }
    await i.deferReply({ flags: MessageFlags.Ephemeral });
    const fresh = await runProfile(ft, lba, adzuna, careerjet, smartrecruiters, lever, greenhouse, db, p, cfg.excludedHosts, cfg.offerMaxAgeDays);
    const posted = await postFreshOffers(db, p, fresh, (pp, o, notify) => postOffer(client, pp, o, notify));
    await i.editReply(`Pipeline exécuté : ${posted} offre(s) postée(s).`);
  }
}

async function handleJobs(i: ChatInputCommandInteraction, cfg: Config, ft: FtClient): Promise<void> {
  const q = i.options.getString("q", true);
  const lieu = i.options.getString("lieu");
  const titre = i.options.getString("titre");
  if (!sane(q) || !sane(lieu) || !sane(titre)) {
    await i.reply({ content: "Paramètre invalide.", flags: MessageFlags.Ephemeral });
    return;
  }
  await i.deferReply({ flags: MessageFlags.Ephemeral });

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
