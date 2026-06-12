Pour enrichir la base de données de votre projet **Job Searcher**, l’exploitation directe des API publiques et des flux RSS de ces plateformes de recrutement majeures (ATS) reste la méthode la plus rapide et la plus fiable. Elle évite d’avoir à exécuter des instances lourdes de Chromium ou de risquer des blocages Cloudflare récurrents.

Le tableau suivant liste 30 nouvelles grandes entreprises et scale-ups incontournables qui recrutent activement en France, avec leurs endpoints directement testables.

---

### 1. Tableau récapitulatif des 30 sources ATS publiques

| N° | Entreprise | ATS | Slug / Tenant (Site ID) | Endpoint API Exact à Tester | Filtrable France | Contrats Probables | Niveau |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **1** | Ubisoft | SmartRecruiters | `Ubisoft` | `https://api.smartrecruiters.com/v1/companies/Ubisoft/postings?country=fr&limit=100` | Oui | Alternance, Stage, CDI, VIE | Facile |
| **2** | Decathlon | SmartRecruiters | `Decathlon` | `https://api.smartrecruiters.com/v1/companies/Decathlon/postings?country=fr&limit=100` | Oui | Stage, Alternance, CDI, CDD, Job Étudiant | Facile |
| **3** | Wavestone | SmartRecruiters | `Wavestone` | `https://api.smartrecruiters.com/v1/companies/Wavestone/postings?country=fr&limit=100` | Oui | Stage, Alternance, CDI, VIE | Facile |
| **4** | Sopra Steria | SmartRecruiters | `SopraSteria` | `https://api.smartrecruiters.com/v1/companies/SopraSteria/postings?country=fr&limit=100` | Oui | Stage, Alternance, CDI, VIE | Facile |
| **5** | Leroy Merlin | SmartRecruiters | `LeroyMerlin` | `https://api.smartrecruiters.com/v1/companies/LeroyMerlin/postings?country=fr&limit=100` | Oui | Stage, Alternance, CDI, Job Étudiant | Facile |
| **6** | Egis Group | SmartRecruiters | `EgisGroup` | `https://api.smartrecruiters.com/v1/companies/EgisGroup/postings?country=fr&limit=100` | Oui | Stage, Alternance, CDI, VIE | Facile |
| **7** | Veolia France | SmartRecruiters | `VeoliaEnvironnementSA` | `https://api.smartrecruiters.com/v1/companies/VeoliaEnvironnementSA/postings?country=fr&limit=100` | Oui | Stage, Alternance, CDI, CDD, VIE | Facile |
| **8** | Les Mousquetaires | SmartRecruiters | `GroupementMousquetaires` | `https://api.smartrecruiters.com/v1/companies/GroupementMousquetaires/postings?country=fr&limit=100` | Oui | Job Étudiant, Alternance, CDD, CDI | Facile |
| **9** | Accor | SmartRecruiters | `Accor` | `https://api.smartrecruiters.com/v1/companies/Accor/postings?country=fr&limit=100` | Oui | Stage, Alternance, CDI, Job Étudiant | Facile |
| **10** | SGS France | SmartRecruiters | `SGS` | `https://api.smartrecruiters.com/v1/companies/SGS/postings?country=fr&limit=100` | Oui | Stage, Alternance, CDI, CDD | Facile |
| **11** | ManoMano | Lever | `manomano` | `https://api.lever.co/v0/postings/manomano?mode=json` | Côté Node | Stage, Alternance, CDI | Facile |
| **12** | Heetch | Lever | `heetch` | `https://api.lever.co/v0/postings/heetch?mode=json` | Côté Node | Stage, Alternance, CDI | Facile |
| **13** | Gorgias | Lever | `gorgias` | `https://api.lever.co/v0/postings/gorgias?mode=json` | Côté Node | CDI, Stage | Facile |
| **14** | Spendesk | Lever | `spendesk` | `https://api.lever.co/v0/postings/spendesk?mode=json` | Côté Node | Stage, Alternance, CDI | Facile |
| **15** | Algolia | Lever | `algolia` | `https://api.lever.co/v0/postings/algolia?mode=json` | Côté Node | Stage, Alternance, CDI | Facile |
| **16** | Brevo | Lever | `brevo` | `https://api.lever.co/v0/postings/brevo?mode=json` | Côté Node | Stage, Alternance, CDI | Facile |
| **17** | Doctolib | Greenhouse | `doctolib` | `https://boards-api.greenhouse.io/v1/boards/doctolib/jobs?content=true` | Côté Node | Stage, Alternance, CDI | Facile |
| **18** | BlaBlaCar | Greenhouse | `blablacar` | `https://boards-api.greenhouse.io/v1/boards/blablacar/jobs?content=true` | Côté Node | Stage, Alternance, CDI | Facile |
| **19** | Back Market | Greenhouse | `backmarket` | `https://boards-api.greenhouse.io/v1/boards/backmarket/jobs?content=true` | Côté Node | Stage, Alternance, CDI | Facile |
| **20** | Mirakl | Greenhouse | `mirakl` | `https://boards-api.greenhouse.io/v1/boards/mirakl/jobs?content=true` | Côté Node | Stage, Alternance, CDI | Facile |
| **21** | Malt | Greenhouse | `malt` | `https://boards-api.greenhouse.io/v1/boards/malt/jobs?content=true` | Côté Node | Stage, Alternance, CDI | Facile |
| **22** | Dataiku | Greenhouse | `dataiku` | `https://boards-api.greenhouse.io/v1/boards/dataiku/jobs?content=true` | Côté Node | Stage, Alternance, CDI | Facile |
| **23** | Deezer | Teamtailor | `deezer` | `https://deezer.teamtailor.com/jobs.rss` | Côté Node | Stage, Alternance, CDI | Facile |
| **24** | Yousign | Teamtailor | `yousign` | `https://yousign.teamtailor.com/jobs.rss` | Côté Node | Stage, Alternance, CDI, CDD | Facile |
| **25** | Papernest | Teamtailor | `papernest` | `https://papernest.teamtailor.com/jobs.rss` | Côté Node | Stage, Alternance, CDI | Facile |
| **26** | Leocare | Teamtailor | `leocare` | `https://leocare.teamtailor.com/jobs.rss` | Côté Node | Stage, Alternance, CDI, CDD | Facile |
| **27** | Pennylane | Teamtailor | `pennylane` | `https://pennylane.teamtailor.com/jobs.rss` | Côté Node | Stage, Alternance, CDI | Facile |
| **28** | Thales | Workday | `thales` (Careers) | `https://thales.wd3.myworkdayjobs.com/wday/cxs/thales/Careers/jobs` | Requête POST | Alternance, Stage, CDI, VIE | Moyen |
| **29** | Michelin | Workday | `michelinhr` (Michelin) | `https://michelinhr.wd3.myworkdayjobs.com/wday/cxs/michelinhr/Michelin/jobs` | Requête POST | Alternance, Stage, CDI, CDD, VIE | Moyen |
| **30** | Airbus | Workday | `airbus` (Airbus) | `https://airbus.wd3.myworkdayjobs.com/wday/cxs/airbus/Airbus/jobs` | Requête POST | Stage, Alternance, CDI, VIE | Moyen |

---

### 2. Détail technique des 30 sources à tester en premier

#### Groupe 1 : SmartRecruiters (GET - JSON)
*Le filtrage de l’API se fait nativement via l'URL avec le paramètre `country=fr`. La réponse contient des objets structurés faciles à parser.*

##### 1. Ubisoft
* **Site carrière officiel** : `https://careers.ubisoft.com/`
* **Slug exact** : `Ubisoft`
* **Endpoint API** : `https://api.smartrecruiters.com/v1/companies/Ubisoft/postings?country=fr&limit=100`
* **Filtrable France** : Oui.
* **Contrats** : Alternance, Stage, CDI, VIE.
* **Niveau** : Facile.
* **Pertinence** : Secteur Tech/Jeux Vidéo majeur en France (studios à Paris, Annecy, Montpellier, Lyon) très recherché par les jeunes diplômés et stagiaires.

##### 2. Decathlon
* **Site carrière officiel** : `https://joinus.decathlon.fr/`
* **Slug exact** : `Decathlon`
* **Endpoint API** : `https://api.smartrecruiters.com/v1/companies/Decathlon/postings?country=fr&limit=100`
* **Filtrable France** : Oui.
* **Contrats** : Stage, Alternance, CDI, CDD, Job Étudiant.
* **Niveau** : Facile.
* **Pertinence** : Propose d'importants volumes de jobs étudiants et de contrats d'alternance partout en France.

##### 3. Wavestone
* **Site carrière officiel** : `https://www.wavestone.com/fr/carrieres/nos-offres/`
* **Slug exact** : `Wavestone`
* **Endpoint API** : `https://api.smartrecruiters.com/v1/companies/Wavestone/postings?country=fr&limit=100`
* **Filtrable France** : Oui.
* **Contrats** : Stage, Alternance, CDI, VIE.
* **Niveau** : Facile.
* **Pertinence** : Cabinet de conseil de référence pour les profils Bac+5 (Grandes Écoles de commerce et d'ingénieurs).

##### 4. Sopra Steria
* **Site carrière officiel** : `https://www.soprasteria.fr/carrieres`
* **Slug exact** : `SopraSteria`
* **Endpoint API** : `https://api.smartrecruiters.com/v1/companies/SopraSteria/postings?country=fr&limit=100`
* **Filtrable France** : Oui.
* **Contrats** : Stage, Alternance, CDI, VIE.
* **Niveau** : Facile.
* **Pertinence** : ESN géante en France recrutant de multiples profils débutants et alternants en développement, cybersécurité et réseau.

##### 5. Leroy Merlin
* **Site carrière officiel** : `https://recrute.leroymerlin.fr/`
* **Slug exact** : `LeroyMerlin`
* **Endpoint API** : `https://api.smartrecruiters.com/v1/companies/LeroyMerlin/postings?country=fr&limit=100`
* **Filtrable France** : Oui.
* **Contrats** : Stage, Alternance, CDI, CDD, Job Étudiant.
* **Niveau** : Facile.
* **Pertinence** : Recrutements soutenus en alternance (fonctions centrales et logistiques) et jobs étudiants en magasins.

##### 6. Egis Group
* **Site carrière officiel** : `https://www.egis-group.com/careers`
* **Slug exact** : `EgisGroup`
* **Endpoint API** : `https://api.smartrecruiters.com/v1/companies/EgisGroup/postings?country=fr&limit=100`
* **Filtrable France** : Oui.
* **Contrats** : Stage, Alternance, CDI, VIE.
* **Niveau** : Facile.
* **Pertinence** : Acteur de l'ingénierie civile, des transports et de l'environnement proposant des opportunités de stages et VIE.

##### 7. Veolia France
* **Site carrière officiel** : `https://www.veolia.com/fr/carrieres`
* **Slug exact** : `VeoliaEnvironnementSA`
* **Endpoint API** : `https://api.smartrecruiters.com/v1/companies/VeoliaEnvironnementSA/postings?country=fr&limit=100`
* **Filtrable France** : Oui.
* **Contrats** : Stage, Alternance, CDI, CDD, VIE.
* **Niveau** : Facile.
* **Pertinence** : Très engagé sur l'apprentissage (métiers de l'énergie, traitement de l'eau, R&D).

##### 8. Les Mousquetaires
* **Site carrière officiel** : `https://www.mousquetaires.com/nous-rejoindre/`
* **Slug exact** : `GroupementMousquetaires`
* **Endpoint API** : `https://api.smartrecruiters.com/v1/companies/GroupementMousquetaires/postings?country=fr&limit=100`
* **Filtrable France** : Oui.
* **Contrats** : Job Étudiant, Alternance, CDD, CDI.
* **Niveau** : Facile.
* **Pertinence** : Importantes options de jobs étudiants (temps partiel, contrats de fin de semaine).

##### 9. Accor
* **Site carrière officiel** : `https://careers.accor.com/`
* **Slug exact** : `Accor`
* **Endpoint API** : `https://api.smartrecruiters.com/v1/companies/Accor/postings?country=fr&limit=100`
* **Filtrable France** : Oui.
* **Contrats** : Stage, Alternance, CDI, Job Étudiant.
* **Niveau** : Facile.
* **Pertinence** : Offres variées dans l'hôtellerie et la restauration en Île-de-France et en régions.

##### 10. SGS France
* **Site carrière officiel** : `https://www.sgs.com/en-fr/careers`
* **Slug exact** : `SGS`
* **Endpoint API** : `https://api.smartrecruiters.com/v1/companies/SGS/postings?country=fr&limit=100`
* **Filtrable France** : Oui.
* **Contrats** : Stage, Alternance, CDI, CDD.
* **Niveau** : Facile.
* **Pertinence** : Audit et contrôle de qualité, idéal pour cibler les profils QHSE et ingénieurs généralistes.

---

#### Groupe 2 : Lever (GET - JSON)
*L'API de Lever ne filtre pas directement par pays dans la requête URL. Le filtrage se fait côté Node.js en inspectant la clé `categories.location`.*

##### 11. ManoMano
* **Site carrière officiel** : `https://careers.manomano.com/`
* **Slug exact** : `manomano`
* **Endpoint API** : `https://api.lever.co/v0/postings/manomano?mode=json`
* **Filtrable France** : Côté Node (vérifier si `location` contient "Paris" ou "France").
* **Contrats** : Stage, Alternance, CDI.
* **Niveau** : Facile.
* **Pertinence** : Acteur de premier plan de la Tech française, recherché pour ses stages en Marketing digital, Data et Tech.

##### 12. Heetch
* **Site carrière officiel** : `https://careers.heetch.com/`
* **Slug exact** : `heetch`
* **Endpoint API** : `https://api.lever.co/v0/postings/heetch?mode=json`
* **Filtrable France** : Côté Node.
* **Contrats** : Stage, Alternance, CDI.
* **Niveau** : Facile.
* **Pertinence** : Start-up dynamique appréciée des jeunes diplômés pour ses opportunités opérationnelles et produit.

##### 13. Gorgias
* **Site carrière officiel** : `https://www.gorgias.com/careers`
* **Slug exact** : `gorgias`
* **Endpoint API** : `https://api.lever.co/v0/postings/gorgias?mode=json`
* **Filtrable France** : Côté Node.
* **Contrats** : CDI, Stage.
* **Niveau** : Facile.
* **Pertinence** : Entreprise très orientée "télétravail" (Remote/Hybride) appréciée par les profils Tech.

##### 14. Spendesk
* **Site carrière officiel** : `https://www.spendesk.com/fr/careers/`
* **Slug exact** : `spendesk`
* **Endpoint API** : `https://api.lever.co/v0/postings/spendesk?mode=json`
* **Filtrable France** : Côté Node.
* **Contrats** : Stage, Alternance, CDI.
* **Niveau** : Facile.
* **Pertinence** : Fintech reconnue, proposant des stages orientés Sales, RH ou Finance SaaS.

##### 15. Algolia
* **Site carrière officiel** : `https://www.algolia.com/careers/`
* **Slug exact** : `algolia`
* **Endpoint API** : `https://api.lever.co/v0/postings/algolia?mode=json`
* **Filtrable France** : Côté Node.
* **Contrats** : Stage, Alternance, CDI.
* **Niveau** : Facile.
* **Pertinence** : Très pertinent pour les développeurs, ingénieurs d'infrastructure et spécialistes API.

##### 16. Brevo
* **Site carrière officiel** : `https://www.brevo.com/fr/careers/`
* **Slug exact** : `brevo`
* **Endpoint API** : `https://api.lever.co/v0/postings/brevo?mode=json`
* **Filtrable France** : Côté Node.
* **Contrats** : Stage, Alternance, CDI.
* **Niveau** : Facile.
* **Pertinence** : Leader du marketing digital, recrute régulièrement des profils en Customer Success et communication.

---

#### Groupe 3 : Greenhouse (GET - JSON)
*Comme pour Lever, l'API publique de Greenhouse renvoie toutes les offres. Il faut filtrer en Node.js en vérifiant que le champ `location.name` contient "France" ou "Paris".*

##### 17. Doctolib
* **Site carrière officiel** : `https://careers.doctolib.fr/`
* **Slug exact** : `doctolib`
* **Endpoint API** : `https://boards-api.greenhouse.io/v1/boards/doctolib/jobs?content=true`
* **Filtrable France** : Côté Node.
* **Contrats** : Stage, Alternance, CDI.
* **Niveau** : Facile.
* **Pertinence** : Grand pourvoyeur d'alternances en Sales, Operations et Talent Acquisition en Île-de-France.

##### 18. BlaBlaCar
* **Site carrière officiel** : `https://www.blablacar.com/about-us/careers`
* **Slug exact** : `blablacar`
* **Endpoint API** : `https://boards-api.greenhouse.io/v1/boards/blablacar/jobs?content=true`
* **Filtrable France** : Côté Node.
* **Contrats** : Stage, Alternance, CDI.
* **Niveau** : Facile.
* **Pertinence** : Icone du covoiturage, excellente marque employeur pour les jeunes ingénieurs et spécialistes produit.

##### 19. Back Market
* **Site carrière officiel** : `https://www.backmarket.com/fr-fr/c/careers`
* **Slug exact** : `backmarket`
* **Endpoint API** : `https://boards-api.greenhouse.io/v1/boards/backmarket/jobs?content=true`
* **Filtrable France** : Côté Node.
* **Contrats** : Stage, Alternance, CDI.
* **Niveau** : Facile.
* **Pertinence** : Idéal pour les profils axés sur le développement durable, le design et l'e-commerce.

##### 20. Mirakl
* **Site carrière officiel** : `https://www.mirakl.com/careers`
* **Slug exact** : `mirakl`
* **Endpoint API** : `https://boards-api.greenhouse.io/v1/boards/mirakl/jobs?content=true`
* **Filtrable France** : Côté Node.
* **Contrats** : Stage (apprentissage), Alternance, CDI.
* **Niveau** : Facile.
* **Pertinence** : Licorne tech à forte visibilité, propice à de premiers rôles en gestion de projet et commerce B2B.

##### 21. Malt
* **Site carrière officiel** : `https://www.malt.fr/careers`
* **Slug exact** : `malt`
* **Endpoint API** : `https://boards-api.greenhouse.io/v1/boards/malt/jobs?content=true`
* **Filtrable France** : Côté Node.
* **Contrats** : Stage, Alternance, CDI.
* **Niveau** : Facile.
* **Pertinence** : Idéal pour comprendre l'écosystème des indépendants et du travail en freelance en Europe.

##### 22. Dataiku
* **Site carrière officiel** : `https://www.dataiku.com/careers/`
* **Slug exact** : `dataiku`
* **Endpoint API** : `https://boards-api.greenhouse.io/v1/boards/dataiku/jobs?content=true`
* **Filtrable France** : Côté Node.
* **Contrats** : Stage, Alternance, CDI.
* **Niveau** : Facile.
* **Pertinence** : Spécialiste de l'IA et de la Data Science, recherché par les profils d'ingénieurs quantitatifs ou data analysts.

---

#### Groupe 4 : Teamtailor (GET - XML / RSS)
*Teamtailor expose un flux RSS natif d’une grande simplicité d’accès. Le filtrage géographique s'effectue en Node.js.*

##### 23. Deezer
* **Site carrière officiel** : `https://jobs.deezer.com/`
* **Slug exact** : `deezer`
* **Endpoint API** : `https://deezer.teamtailor.com/jobs.rss`
* **Filtrable France** : Côté Node (le champ `<title>` ou la description indiquent généralement la ville).
* **Contrats** : Stage, Alternance, CDI.
* **Niveau** : Facile.
* **Pertinence** : Plateforme de streaming de musique française qui recrute activement ses alternants en Product & Tech (Paris/Bordeaux).

##### 24. Yousign
* **Site carrière officiel** : `https://yousign.com/fr/carrieres`
* **Slug exact** : `yousign`
* **Endpoint API** : `https://yousign.teamtailor.com/jobs.rss`
* **Filtrable France** : Côté Node.
* **Contrats** : Stage, Alternance, CDI, CDD.
* **Niveau** : Facile.
* **Pertinence** : Éditeur de confiance numérique d'origine normande (Paris/Caen), idéal pour des profils commerciaux ou support client.

##### 25. Papernest
* **Site carrière officiel** : `https://www.papernest.com/careers`
* **Slug exact** : `papernest`
* **Endpoint API** : `https://papernest.teamtailor.com/jobs.rss`
* **Filtrable France** : Côté Node.
* **Contrats** : Stage, Alternance, CDI.
* **Niveau** : Facile.
* **Pertinence** : Propose d'importantes vagues de stages de fin d'études en Opérations, Marketing et Sales.

##### 26. Leocare
* **Site carrière officiel** : `https://leocare.teamtailor.com/`
* **Slug exact** : `leocare`
* **Endpoint API** : `https://leocare.teamtailor.com/jobs.rss`
* **Filtrable France** : Côté Node.
* **Contrats** : Stage, Alternance, CDI, CDD.
* **Niveau** : Facile.
* **Pertinence** : Néo-assurance rennaise dynamique proposant régulièrement des postes en Relation Client et Data.

##### 27. Pennylane
* **Site carrière officiel** : `https://www.pennylane.com/fr/recrutement/`
* **Slug exact** : `pennylane`
* **Endpoint API** : `https://pennylane.teamtailor.com/jobs.rss`
* **Filtrable France** : Côté Node.
* **Contrats** : Stage, Alternance, CDI.
* **Niveau** : Facile.
* **Pertinence** : Outil de comptabilité leader pour PME, proposant des opportunités aux jeunes diplômés en gestion et commerce.

---

#### Groupe 5 : Workday (POST - JSON)
*Ces grandes entreprises requièrent une requête POST vers l’endpoint XHR sous le format indiqué ci-dessous.*

```json
// Format de payload standard pour requêter l'API Workday :
{
  "limit": 20,
  "offset": 0,
  "searchText": "France", 
  "appliedFacets": {}
}
```

##### 28. Thales
* **Site carrière officiel** : `https://careers.thalesgroup.com/`
* **Tenant** : `thales`
* **SiteId** : `Careers`
* **Endpoint API** : `https://thales.wd3.myworkdayjobs.com/wday/cxs/thales/Careers/jobs`
* **Filtrable France** : Oui, via le paramètre `"searchText": "France"` dans le payload POST.
* **Contrats** : Alternance, Stage, CDI, VIE.
* **Niveau** : Moyen.
* **Pertinence** : Leader aéronautique et défense, l'un des plus grands employeurs d'alternants en ingénierie et cybersécurité en France.

##### 29. Michelin
* **Site carrière officiel** : `https://recrutement.michelin.fr/`
* **Tenant** : `michelinhr`
* **SiteId** : `Michelin`
* **Endpoint API** : `https://michelinhr.wd3.myworkdayjobs.com/wday/cxs/michelinhr/Michelin/jobs`
* **Filtrable France** : Oui, via requête POST.
* **Contrats** : Alternance, Stage, CDI, CDD, VIE.
* **Niveau** : Moyen.
* **Pertinence** : Enorme volume d'alternances et de stages R&D (Ladoux/Clermont-Ferrand), usines et commerce.

##### 30. Airbus
* **Site carrière officiel** : `https://www.airbus.com/en/careers`
* **Tenant** : `airbus`
* **SiteId** : `Airbus`
* **Endpoint API** : `https://airbus.wd3.myworkdayjobs.com/wday/cxs/airbus/Airbus/jobs`
* **Filtrable France** : Oui, via requête POST.
* **Contrats** : Stage, Alternance, CDI, VIE.
* **Niveau** : Moyen.
* **Pertinence** : Référence aéronautique pour les profils industriels et d'ingénieurs (Toulouse, Nantes, Saint-Nazaire).

---

### 3. Note de mise en œuvre en TypeScript / Node.js

Pour traiter ces 30 sources, vous n'avez besoin que d'une bibliothèque HTTP simple comme `axios` et, pour les sources Teamtailor, d'un parseur XML léger comme `rss-parser`.

#### Exemple de parsing RSS (Teamtailor) :
```typescript
import Parser from 'rss-parser';

const parser = new Parser();

async function parseTeamtailorFeed(companySlug: string) {
  const feed = await parser.parseURL(`https://${companySlug}.teamtailor.com/jobs.rss`);
  
  feed.items.forEach(item => {
    console.log(`Titre : ${item.title}`);
    console.log(`Lien direct : ${item.link}`);
    console.log(`Date de publication : ${item.pubDate}`);
  });
}
```

* **Gestion du User-Agent** : Sur les plateformes Lever et Greenhouse, les requêtes sont généralement fluides. Sur Workday (Thales, Michelin, Airbus), configurez un en-tête `User-Agent` de navigateur moderne (ex: Chrome sur Windows ou macOS) afin de limiter d'éventuels rejets automatiques liés à des profils d'en-tête trop génériques.