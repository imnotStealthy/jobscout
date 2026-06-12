# JobScout

Bot Discord d'agrégation d'offres d'emploi, conçu pour tourner en continu sur un VPS.
Il interroge l'API officielle **France Travail « Offres d'emploi v2 »**, filtre les
offres selon des **profils de recherche** (titre de poste, localisation, mobilité
géographique, télétravail, type de contrat…), déduplique, puis poste chaque nouvelle
offre dans le **salon Discord** associé au profil. Une **API REST** est exposée dans
le même process.

> Règle produit : les offres provenant de **LinkedIn** ou **Indeed** sont exclues, et
> chaque offre postée renvoie **toujours vers la page carrière / jobboard d'origine**,
> jamais vers une page intermédiaire.

---

## Sommaire

1. [Architecture](#architecture)
2. [Fonctionnement détaillé](#fonctionnement-détaillé)
3. [Profils de recherche](#profils-de-recherche)
4. [Commandes Discord](#commandes-discord)
5. [API REST](#api-rest)
6. [Installation locale](#installation-locale)
7. [Déploiement VPS](#déploiement-vps)
8. [Configuration](#configuration)
9. [Sécurité](#sécurité)

---

## Architecture

Un seul process Node.js (TypeScript, Node ≥ 20) qui héberge trois sous-systèmes :

```
┌────────────────────────────────────────────────────────────┐
│                      JobScout (1 process)                  │
│                                                            │
│  ┌──────────────┐   ┌───────────────┐   ┌──────────────┐  │
│  │  Scheduler   │   │  Bot Discord  │   │   API REST   │  │
│  │  node-cron   │   │ discord.js v14│   │     Hono     │  │
│  │ (poll 30min) │   │   (gateway)   │   │   :8787      │  │
│  └──────┬───────┘   └───────┬───────┘   └──────┬───────┘  │
│         │                   │                  │          │
│         └──────────┬────────┴──────────────────┘          │
│                    ▼                                       │
│        ┌───────────────────────┐    ┌──────────────────┐  │
│        │  Pipeline (poller.ts) │───▶│ SQLite (better-  │  │
│        │  requêtes FT + filtres│    │ sqlite3, fichier │  │
│        └───────────┬───────────┘    │ data/jobscout.db)│  │
│                    ▼                └──────────────────┘  │
│        ┌───────────────────────┐                          │
│        │ API France Travail v2 │  (OAuth2, throttle 4r/s) │
│        └───────────────────────┘                          │
└────────────────────────────────────────────────────────────┘
```

| Module | Fichier | Rôle |
|---|---|---|
| Config | `src/config.ts` | Lecture/validation des variables d'env |
| DB | `src/db.ts` | SQLite, migrations idempotentes, dédup, purge |
| Client FT | `src/ftClient.ts` | OAuth2 client_credentials, cache token, throttle |
| Filtres | `src/hostFilter.ts` | Exclusion d'hôtes, normalisation accents |
| Pipeline | `src/poller.ts` | Construction requêtes, agrégation, post-filtres |
| Bot | `src/discord/` | Gateway, slash commands, embeds |
| API | `src/api/server.ts` | Endpoints REST, rate-limit, CORS, headers |
| Entrée | `src/index.ts` | Démarrage, crons |

---

## Fonctionnement détaillé

### 1. Authentification France Travail

Au premier appel, le client demande un token OAuth2 (`client_credentials`) sur le
endpoint partenaire de France Travail (scope `api_offresdemploiv2 o2dsoffre`). Le
token est **mis en cache en mémoire** et renouvelé automatiquement 60 s avant son
expiration. Toutes les requêtes passent par un **throttle ~4 req/s** (quota FT).

### 2. Boucle de poll (cron, par défaut toutes les 30 min)

Pour chaque profil actif (`enabled = 1`) :

1. **Construction des requêtes** — les critères du profil sont traduits en
   paramètres FT :
   - `keywords` → `motsCles`
   - `rome_codes` → `codeROME`, `appellations` → `appellation`
   - `type_contrat` → `typeContrat`
   - localisation : **une requête par commune** (code INSEE + `distance` = rayon de
     mobilité en km), plus une requête par scope `departement` / `region` si présents.
2. **Exécution** — les requêtes partent vers l'API FT en respectant le throttle ;
   les résultats sont **agrégés et dédupliqués par identifiant d'offre**.
3. **Post-filtrage** (ordre strict, voir ci-dessous).
4. **Publication** — chaque offre retenue et jamais vue est postée en **embed** dans
   le salon Discord du profil, puis enregistrée dans `seen_offers` (dédup durable).

### 3. Post-filtre (ordre strict)

Chaque offre passe la chaîne suivante — au premier échec, elle est écartée :

```
1. Extraction du host depuis origineOffre.urlOrigine (fallback urlPostulation)
2. DROP si host exclu (linkedin.*, *.indeed.*, ou URL absente/invalide)
3. DROP si le profil définit des titres ET qu'aucun ne matche l'intitulé
   (comparaison normalisée : minuscules + accents supprimés, "Chargé" ≡ "charge")
4. DROP si le profil exige le télétravail ET que l'offre ne le mentionne pas
5. DROP si (profil, offre) déjà présent dans seen_offers
```

Le filtre d'hôte fonctionne par **suffixe de domaine** (`linkedin.com` couvre
`fr.linkedin.com`) ou par **label de marque tous TLD** (`indeed` couvre `indeed.fr`,
`indeed.com`…). Une offre **sans URL d'origine fiable n'est jamais affichée**.

### 4. Embed Discord

Chaque offre postée affiche : intitulé (cliquable → **URL d'origine**), entreprise,
lieu, type de contrat et date de publication.

### 5. Dédoublonnage & rétention

La table `seen_offers` (clé primaire `(profile_id, offer_id)`) garantit qu'une offre
n'est **jamais postée deux fois** dans le même salon. Une purge quotidienne (04h00)
supprime les entrées plus vieilles que `SEEN_RETENTION_DAYS` (30 jours par défaut).

---

## Profils de recherche

Un profil = un salon Discord. Les membres s'abonnent en rejoignant le salon
(reaction-roles côté serveur, hors scope du bot). Champs d'un profil :

| Champ | Type | Effet |
|---|---|---|
| `label` | texte | Nom lisible ("PMO / Transfo digitale") |
| `discord_channel_id` | id | Salon de publication |
| `titres` | liste | Match obligatoire sur l'intitulé (normalisé) |
| `keywords` | liste | Mots-clés envoyés à FT (`motsCles`) |
| `rome_codes`, `appellations` | listes | Ciblage métier référentiel ROME |
| `communes` | codes INSEE | Localisation précise |
| `rayon_km` | entier | Mobilité géographique autour des communes |
| `departements`, `regions` | listes | Scopes géographiques larges |
| `teletravail` | oui/non/indifférent | Post-filtre texte si non géré par FT |
| `type_contrat` | liste | `CDI`, `CDD`, … |
| `enabled` | bool | Active/suspend le profil |

---

## Commandes Discord

### Admin (permission Administrateur requise)

| Commande | Description |
|---|---|
| `/profile add label channel titres keywords [rome] [communes] [rayon] [dept] [region] [teletravail] [contrat]` | Créer un profil |
| `/profile edit id [champ…]` | Modifier un profil |
| `/profile list` | Lister les profils |
| `/profile remove id` | Supprimer un profil |
| `/profile test id` | Exécuter le pipeline immédiatement (debug) |

### Public

| Commande | Description |
|---|---|
| `/jobs q [lieu] [rayon] [titre]` | Recherche ad hoc, réponse **éphémère** (visible par l'appelant seul), mêmes filtres d'hôte |

Les commandes sont enregistrées **guild-scoped** si `DISCORD_GUILD_ID` est défini
(propagation immédiate), sinon globales.

---

## API REST

Servie sur `API_PORT` (8787 par défaut), même process que le bot.

| Endpoint | Description |
|---|---|
| `GET /healthz` | `{ "status": "ok" }` — supervision |
| `GET /api/offers?q=<mots>&commune=<insee>&rayon=<km>&rome=<code>&dept=<num>&titre=<csv>` | Recherche filtrée (hosts exclus), liens = URL d'origine |

Protections : **rate-limit 30 req/min/IP**, **CORS liste blanche** (jamais `*`),
en-têtes `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
`Permissions-Policy` sur chaque réponse.

---

## Installation locale

Prérequis : Node.js ≥ 20, un compte développeur [francetravail.io](https://francetravail.io)
(application avec l'API « Offres d'emploi v2 »), une application Discord
([Developer Portal](https://discord.com/developers/applications)) avec un bot invité
sur le serveur (permissions : envoyer des messages, intégrer des liens).

```bash
git clone https://github.com/imnotStealthy/jobscout.git
cd jobscout
npm install
cp .env.example .env   # remplir les credentials (voir Configuration)
npm run dev            # lance bot + API + crons
```

Vérifications :

```bash
curl http://localhost:8787/healthz      # → { "status": "ok" }
npm test                                 # tests unitaires (filtre host)
npm run build                            # compile vers dist/
```

Puis dans Discord : `/profile add …` et `/profile test id:1` pour valider le
pipeline de bout en bout.

---

## Déploiement VPS

Service **systemd** (`Restart=always` → survit aux crashs et au reboot), user dédié
non-root, code dans `/opt/jobscout`, durcissement (`ProtectSystem=strict`,
`NoNewPrivileges`, écriture limitée à `data/`). Voir `CLAUDE.md` §8 pour l'unité
systemd complète.

```bash
systemctl enable --now jobscout
journalctl -u jobscout -f    # logs
```

---

## Configuration

Variables d'environnement (`.env`, jamais commité — `.env.example` documente tout) :

| Variable | Description | Défaut |
|---|---|---|
| `FT_CLIENT_ID` / `FT_CLIENT_SECRET` | Credentials France Travail | — |
| `DISCORD_BOT_TOKEN` | Token du bot | — |
| `DISCORD_APP_ID` | ID de l'application Discord | — |
| `DISCORD_GUILD_ID` | Serveur cible (commands guild-scoped) | optionnel |
| `CORS_ALLOWED_ORIGINS` | Origines autorisées (csv) | — |
| `EXCLUDED_HOSTS` | Hôtes exclus (csv) | `linkedin.com,indeed` |
| `SEEN_RETENTION_DAYS` | Rétention dédup (jours) | `30` |
| `POLL_CRON` | Fréquence de poll | `*/30 * * * *` |
| `API_PORT` | Port de l'API REST | `8787` |

---

## Sécurité

- Aucun secret dans le repo ; credentials uniquement via variables d'environnement.
- Requêtes SQLite **paramétrées** ; entrées slash commands / REST validées
  (longueur, charset, formats INSEE/ROME).
- Token FT jamais loggé.
- RGPD : seuls des **profils de recherche** sont stockés — aucune donnée
  d'identité utilisateur.
- `npm audit --audit-level=high` avant chaque release.
