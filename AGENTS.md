# AGENTS.md — JobScout

Bot Discord d'agrégation d'offres d'emploi pour une communauté, tournant **en continu
sur un VPS**. Il interroge une source officielle, filtre selon le profil de recherche
(titre de poste, localisation, mobilité géographique…), déduplique, et poste les offres
dans le **salon Discord du profil/rôle** correspondant. Expose aussi une **API REST**.

> Ce fichier est la **source de vérité unique**. Implémente strictement ce qui suit.
> N'ajoute aucun scope non demandé. Tout élément marqué `assumption:` DOIT être vérifié
> avant codage ; si invérifiable et bloquant, t'arrêter et demander.

---

## 1. Stack (figée)

| Rôle | Choix |
|---|---|
| Runtime | **Node.js ≥ 20**, TypeScript |
| Discord | **discord.js v14** (gateway — process persistant, reconnexion gérée) |
| Scheduler | **node-cron** (in-process, le service tourne en continu) |
| DB | **SQLite** via `better-sqlite3` (fichier unique, zéro infra externe) |
| API REST | **Hono** + `@hono/node-server` (même process) |
| HTTP client | `fetch` natif (Node 20) ou `undici` |
| Process | **systemd**, `Restart=always` → « sans interruption » |

Pas de Cloudflare Workers ici (le besoin VPS persistant favorise la gateway).
Pas de `discord.js` côté HTTP-interactions : la gateway gère commands + posting.

---

## 2. Contraintes produit (non négociables)

1. **Sources interdites** : exclure toute offre dont l'URL d'origine pointe vers
   `linkedin.com` ou `indeed.*` (tout TLD). Filtre sur le **host**. Si pas d'URL
   d'origine fiable → ne pas afficher l'offre.
2. **Redirection** : chaque offre postée renvoie vers la **page carrière officielle /
   jobboard d'origine** (URL d'origine de l'offre), jamais une page interne.
3. **Profils partagés** : 1 profil/rôle = 1 salon Discord. Les users s'abonnent en
   rejoignant le salon (reaction-roles, géré côté serveur Discord, hors scope du bot).

---

## 3. Source de données — France Travail API « Offres d'emploi v2 »

> Portail : https://francetravail.io — compte développeur + licence requis.
> **Toute la section ci-dessous est `assumption:` à confirmer sur le Swagger officiel.
> Ne pas inventer de noms de champs/paramètres.**

- **Recherche** : `GET https://api.francetravail.io/partenaire/offresdemploi/v2/offres`
- **Auth** : OAuth2 `client_credentials`.
  - `assumption:` token endpoint
    `https://entreprise.francetravail.io/connexion/oauth2/access_token?realm=/partenaire`
  - `assumption:` scope `api_offresdemploiv2 o2dsoffre`
  - Cacher le token en mémoire jusqu'à `expires_in - marge`.
- **Quota** : `assumption:` ~4 req/s par application → throttler (token bucket).
- **Pagination** : header `Range: offres 0-49` (`assumption:`).

### 3.1 Mapping critères → paramètres FT (`assumption:` à vérifier)

| Critère profil | Paramètre FT supposé | Note |
|---|---|---|
| Mots-clés | `motsCles` | termes libres |
| Titre de poste | `motsCles` + **post-filtre** sur `intitule` | voir §5.2 |
| Code métier | `codeROME`, `appellation` | référentiel ROME |
| Commune | `commune` (code **INSEE**) | |
| Rayon / mobilité géo | `distance` (km) autour de `commune` | |
| Département | `departement` | |
| Région | `region` | |
| Type de contrat | `typeContrat` | ex. `CDI`, `CDD` |
| Télétravail | `assumption:` param incertain → **post-filtre** texte si absent | |

Si un paramètre supposé n'existe pas (ex. `distance`, `teletravail`), appliquer le
critère en **post-filtre** sur la réponse plutôt que d'inventer un paramètre.

---

## 4. Schéma SQLite

Fichier `data/jobscout.db`. Migration au démarrage (idempotente).

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  label              TEXT    NOT NULL,            -- "PMO / Transfo digitale"
  discord_channel_id TEXT    NOT NULL,            -- salon cible (1 par profil/rôle)

  -- Ciblage poste
  titres             TEXT    NOT NULL,            -- JSON array, match sur intitulé
  keywords           TEXT    NOT NULL,            -- JSON array -> motsCles
  rome_codes         TEXT,                        -- JSON array nullable
  appellations       TEXT,                        -- JSON array nullable

  -- Localisation & mobilité géographique
  communes           TEXT,                        -- JSON array codes INSEE, nullable
  departements       TEXT,                        -- JSON array nullable
  regions            TEXT,                        -- JSON array nullable
  rayon_km           INTEGER,                     -- mobilité autour des communes, nullable
  teletravail        INTEGER,                     -- 1=oui, 0=non, NULL=indifférent

  -- Filtres complémentaires
  type_contrat       TEXT,                        -- JSON array nullable

  enabled            INTEGER NOT NULL DEFAULT 1,
  created_at         TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS seen_offers (
  profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  offer_id   TEXT    NOT NULL,                    -- id offre France Travail
  posted_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (profile_id, offer_id)
);

CREATE INDEX IF NOT EXISTS idx_seen_posted_at  ON seen_offers(posted_at);
CREATE INDEX IF NOT EXISTS idx_profiles_enabled ON profiles(enabled);
```

Purge : tâche cron quotidienne supprimant `seen_offers` plus vieux que
`SEEN_RETENTION_DAYS` (défaut 30).

---

## 5. Logique métier

### 5.1 Boucle de poll (node-cron, ex. `*/30 * * * *`)

```
pour chaque profile WHERE enabled = 1 :
  construire la (ou les) requête(s) FT depuis le profil :
    motsCles = keywords ; codeROME/appellation si fournis ;
    pour la localisation -> émettre une requête par scope présent :
      - chaque commune (+ distance = rayon_km)
      - sinon departements / regions
    typeContrat si fourni
  exécuter en respectant le quota FT (throttle)
  agréger + dédupliquer par offer_id
  -> POST-FILTRE (§5.2)
  -> pour chaque offre retenue non vue : post Discord + INSERT seen_offers
```

### 5.2 Post-filtre (ordre strict)

```
1. host = safeHost(origineOffre.urlOrigine)            // sinon fallback urlPostulation
2. DROP si isExcludedHost(host)                         // linkedin / indeed / host nul
3. DROP si titres non vide ET normalize(intitule) ne contient AUCUN titre normalisé
4. DROP si teletravail = 1 ET offre ne mentionne pas le télétravail   (si non filtré côté FT)
5. DROP si (profile_id, offer_id) déjà dans seen_offers
```

`normalize` : minuscule + suppression des accents (NFD) + trim, pour un match titre
robuste ("Chargé" ~ "charge").

### 5.3 Référence — extraction & exclusion de host (à reprendre tel quel)

```ts
// src/hostFilter.ts
export function safeHost(url?: string | null): string | null {
  if (!url) return null;
  try { return new URL(url).hostname.toLowerCase(); } catch { return null; }
}

// excluded ex: ["linkedin.com", "indeed"]
export function isExcludedHost(host: string | null, excluded: string[]): boolean {
  if (!host) return true; // pas d'URL d'origine fiable -> on n'affiche pas
  return excluded.some((raw) => {
    const e = raw.trim().toLowerCase();
    if (!e) return false;
    if (e.includes(".")) return host === e || host.endsWith("." + e); // suffixe domaine
    return host.split(".").includes(e);                               // label marque, tout TLD
  });
}

export const normalize = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
```

### 5.4 Embed Discord
Champs : intitulé, entreprise, lieu, type de contrat, date de publication, et lien
**vers l'URL d'origine** (`origineOffre.urlOrigine`).

---

## 6. Interface Discord (slash commands)

Enregistrement via REST (`DISCORD_APP_ID` + token), idéalement guild-scoped
(`DISCORD_GUILD_ID`) pour propagation immédiate.

Admin-gated (vérifier permission admin de l'appelant) :
- `/profile add label:<str> channel:<channel> titres:<csv> keywords:<csv>
   [rome:<csv>] [communes:<csv insee>] [rayon:<km>] [dept:<csv>] [region:<csv>]
   [teletravail:<oui|non>] [contrat:<csv>]`
- `/profile edit id:<int> <champ>:<valeur>`
- `/profile list`
- `/profile remove id:<int>`
- `/profile test id:<int>` → exécute le pipeline une fois, immédiatement

Public :
- `/jobs q:<mots> [lieu:<commune|dept>] [rayon:<km>] [titre:<csv>]`
  → recherche ad hoc, réponse **ephemeral**, mêmes filtres host.

Validation : borner longueur/charset des entrées avant insertion. Requêtes SQL
**paramétrées** uniquement.

---

## 7. API REST (Hono, même process)

- `GET /api/offers?q=<mots>&commune=<insee>&rayon=<km>&rome=<code>&dept=<num>&titre=<csv>`
  → `{ offers: [...] }`, déjà filtré (host exclu), liens = `urlOrigine`.
- `GET /healthz` → `{ status: "ok" }` (pour supervision systemd / uptime).
- Rate limit : token bucket par IP (`RATE_LIMITS.api = { windowMs: 60_000, max: 30 }`).
- CORS : liste blanche d'origines depuis `CORS_ALLOWED_ORIGINS` — **jamais `*`**.
- En-têtes de sécurité sur chaque réponse :
  `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy: geolocation=(), camera=(), microphone=()`.

---

## 8. Déploiement VPS (sans interruption)

User dédié non-root, code dans `/opt/jobscout`, secrets dans `/opt/jobscout/.env`
(perms `600`), DB dans `/opt/jobscout/data/`.

```bash
useradd -r -s /usr/sbin/nologin jobscout
# déposer le build dans /opt/jobscout, npm ci --omit=dev, npm run build
chown -R jobscout:jobscout /opt/jobscout && chmod 600 /opt/jobscout/.env
```

`/etc/systemd/system/jobscout.service` :
```ini
[Unit]
Description=JobScout Discord job bot
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=jobscout
WorkingDirectory=/opt/jobscout
EnvironmentFile=/opt/jobscout/.env
ExecStart=/usr/bin/node /opt/jobscout/dist/index.js
Restart=always
RestartSec=5
# Durcissement
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
ReadWritePaths=/opt/jobscout/data
CapabilityBoundingSet=
AmbientCapabilities=

[Install]
WantedBy=multi-user.target
```
```bash
systemctl daemon-reload && systemctl enable --now jobscout
journalctl -u jobscout -f   # logs
```
`Restart=always` + `WantedBy=multi-user.target` = redémarrage auto sur crash et au boot.

---

## 9. Secrets & config

`.env` (jamais commit ; `.env.example` documente sans valeurs) :
```
FT_CLIENT_ID=
FT_CLIENT_SECRET=
DISCORD_BOT_TOKEN=
DISCORD_APP_ID=
DISCORD_GUILD_ID=            # optionnel, pour commands guild-scoped
CORS_ALLOWED_ORIGINS=https://stealthylabs.eu
EXCLUDED_HOSTS=linkedin.com,indeed
SEEN_RETENTION_DAYS=30
POLL_CRON=*/30 * * * *
API_PORT=8787
```

`.gitignore` doit inclure : `.env`, `.env.*` (sauf `!.env.example`), `node_modules/`,
`dist/`, `data/`, `*.log`, `*.pem`, `*.key`.

---

## 10. Sécurité (baseline obligatoire)

- Aucun secret dans le repo ; `.env` perms `600`, user systemd non-root, durcissement systemd.
- Token discord = seul credential de posting (pas de webhooks éparpillés).
- Requêtes SQLite **paramétrées** ; valider toutes les entrées slash command / REST.
- Ne jamais logger secrets ni token FT.
- `npm audit --audit-level=high` avant chaque release.
- RGPD : stocker uniquement des **profils de recherche**, aucune donnée d'identité user.

---

## 11. Definition of Done

- [ ] OAuth FT OK, token caché/rafraîchi, quota respecté (throttle).
- [ ] `assumption:` FT (endpoints, champs `origineOffre.urlOrigine`, params localisation/
      `distance`/`teletravail`) confirmées sur Swagger, ou remontées comme bloquantes.
- [ ] Filtre host exclut linkedin/indeed + fallback host nul (tests unitaires).
- [ ] Post-filtre titre (normalisé, accent-insensible) opérationnel.
- [ ] Localisation + rayon (mobilité géo) appliqués (param FT ou post-filtre).
- [ ] Dédup vérifiée (pas de double post).
- [ ] Cron → poll → post Discord de bout en bout.
- [ ] Slash commands admin/public + `/jobs` ephemeral.
- [ ] API REST filtrée, rate-limitée, CORS verrouillé, en-têtes présents, `/healthz`.
- [ ] systemd : survit crash + reboot ; logs via journalctl.
- [ ] Aucun secret commit ; `.env.example` documente tout.

## 12. Anti-scope (ne PAS faire sans demande)

- Pas de scraping HTML (source = API officielle).
- Pas de matching sémantique / embeddings en v1.
- Pas de Cloudflare Workers / Queues (stack VPS retenue).
- Pas de stockage de données perso users.
