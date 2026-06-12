Voici l’étude technique pour la récupération automatisée d’offres d’emploi en France adaptées aux étudiants et jeunes diplômés (alternance, stage, CDI, CDD, VIE, job étudiant). 

Plutôt que d'avoir recours à un scraping agressif avec un navigateur lourd (Playwright, Puppeteer), la méthode recommandée ici consiste à exploiter les **API publiques et les flux JSON/XML internes** que les principaux ATS (Applicant Tracking Systems) utilisent pour afficher les offres sur leurs sites carrières. Cela permet de récupérer des données structurées de manière rapide, stable et tout à fait légale.

---

### 1. Tableau récapitulatif des 20 sources recommandées en France

| N° | Entreprise / Plateforme | ATS Probable | API/Flux sans Navigateur ? | Difficulté d'Intégration | Contrats Disponibles | Qualité des Liens |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| **1** | **Ubisoft** | SmartRecruiters | **Oui** | **Facile** | Alternance, Stage, CDI, VIE | Redirection ATS |
| **2** | **Decathlon** | SmartRecruiters | **Oui** | **Facile** | Stage, Alternance, CDI, CDD, Job Étudiant | Redirection ATS |
| **3** | **Wavestone** | SmartRecruiters | **Oui** | **Facile** | Stage, Alternance, CDI, VIE | Redirection ATS |
| **4** | **Sopra Steria** | SmartRecruiters | **Oui** | **Facile** | Stage, Alternance, CDI, VIE | Redirection ATS |
| **5** | **Leroy Merlin** | SmartRecruiters | **Oui** | **Facile** | Stage, Alternance, CDI, CDD, Job Étudiant | Redirection ATS |
| **6** | **Canal+ Group** | SmartRecruiters | **Oui** | **Facile** | Stage, Alternance, CDI, VIE | Redirection ATS |
| **7** | **Kiabi** | SmartRecruiters | **Oui** | **Facile** | Stage, Alternance, CDI, CDD, Job Étudiant | Redirection ATS |
| **8** | **BlaBlaCar** | Greenhouse | **Oui** | **Facile** | Stage, Alternance, CDI | Lien Direct |
| **9** | **Back Market** | Greenhouse | **Oui** | **Facile** | Stage, Alternance, CDI | Lien Direct |
| **10** | **Swile** | Greenhouse | **Oui** | **Facile** | Stage, Alternance, CDI | Lien Direct |
| **11** | **PayFit** | Greenhouse | **Oui** | **Facile** | Stage, Alternance, CDI | Lien Direct |
| **12** | **Qonto** | Lever | **Oui** | **Facile** | Stage, Alternance, CDI | Lien Direct |
| **13** | **Airbus** | Workday | **Oui** | **Moyen** | Stage, Alternance, CDI, VIE | Redirection ATS |
| **14** | **TotalEnergies** | Workday | **Oui** | **Moyen** | Stage, Alternance, CDI, CDD, VIE | Redirection ATS |
| **15** | **Sanofi** | Workday | **Oui** | **Moyen** | Stage, Alternance, CDI, VIE | Redirection ATS |
| **16** | **Forvis Mazars** | Workday | **Oui** | **Moyen** | Stage, Alternance, CDI, VIE | Redirection ATS |
| **17** | **Société Générale** | Phenom People | **Oui** | **Moyen** | Stage, Alternance, CDI, VIE, Job Étudiant | Redirection ATS |
| **18** | **L'Oréal** | Phenom People | **Oui** | **Moyen** | Stage, Alternance, CDI, VIE | Redirection ATS |
| **19** | **AXA France** | Phenom People | **Oui** | **Moyen** | Stage, Alternance, CDI, VIE | Redirection ATS |
| **20** | **Capgemini** | SuccessFactors | **Oui** | **Moyen** | Stage, Alternance, CDI, VIE | Redirection ATS |

---

### 2. Fiches Techniques Détaillées des 20 Sources

#### 1. Ubisoft (Tech / Jeux Vidéo)
* **Site carrière** : `https://careers.ubisoft.com/`
* **Type de plateforme** : SmartRecruiters (slug : `Ubisoft`)
* **Sans navigateur ?** Oui (API REST publique).
* **Niveau d’intégration** : Facile.
* **Contrats** : Alternance, Stage, CDI, VIE.
* **Qualité attendue des liens** : Redirection vers l'ATS de candidature (`https://jobs.smartrecruiters.com/Ubisoft/...`).
* **Exemple d’URL de recherche** : `https://api.smartrecruiters.com/v1/companies/Ubisoft/postings?limit=100`
* **Remarque technique** : L'API SmartRecruiters renvoie directement la liste des postes sans authentification. Le typage en TypeScript est standard et robuste.

#### 2. Decathlon (Retail / Sport)
* **Site carrière** : `https://joinus.decathlon.fr/`
* **Type de plateforme** : SmartRecruiters (slug : `Decathlon` ou `DecathlonGroup`)
* **Sans navigateur ?** Oui (API REST).
* **Niveau d’intégration** : Facile.
* **Contrats** : Stage, Alternance, CDI, CDD, Job Étudiant.
* **Qualité attendue des liens** : Redirection ATS.
* **Exemple d’URL de recherche** : `https://api.smartrecruiters.com/v1/companies/Decathlon/postings`
* **Remarque technique** : Idéal pour cibler les jobs étudiants (vendeur, hôte d'accueil) très demandés. Un filtre géographique côté Node.js permet d'extraire uniquement les opportunités en France (`location.country === 'fr'`).

#### 3. Wavestone (Conseil en Transformation)
* **Site carrière** : `https://www.wavestone.com/fr/carrieres/nos-offres/`
* **Type de plateforme** : SmartRecruiters (slug : `Wavestone`)
* **Sans navigateur ?** Oui (API REST).
* **Niveau d’intégration** : Facile.
* **Contrats** : Stage, Alternance, CDI, VIE.
* **Qualité attendue des liens** : Redirection ATS.
* **Exemple d’URL de recherche** : `https://api.smartrecruiters.com/v1/companies/Wavestone/postings`
* **Remarque technique** : Wavestone propose d'importantes vagues de recrutement pour des stages de pré-embauche (fin d'études). La métadonnée `customField` dans le JSON de SmartRecruiters permet parfois de cibler les practices (Cyber, Data, Stratégie).

#### 4. Sopra Steria (ESN)
* **Site carrière** : `https://www.soprasteria.fr/carrieres`
* **Type de plateforme** : SmartRecruiters (slug : `SopraSteria` ou `SopraSteriaGroup`)
* **Sans navigateur ?** Oui (API REST).
* **Niveau d’intégration** : Facile.
* **Contrats** : Stage, Alternance, CDI, VIE.
* **Qualité attendue des liens** : Redirection ATS.
* **Exemple d’URL de recherche** : `https://api.smartrecruiters.com/v1/companies/SopraSteria/postings`
* **Remarque technique** : Enorme volume d'offres en ESN. Le filtrage de la localisation se base sur le champ `location.city`.

#### 5. Leroy Merlin (Distribution / Maison)
* **Site carrière** : `https://recrute.leroymerlin.fr/`
* **Type de plateforme** : SmartRecruiters (slug : `LeroyMerlin`)
* **Sans navigateur ?** Oui.
* **Niveau d’intégration** : Facile.
* **Contrats** : Stage, Alternance, CDI, CDD, Job Étudiant.
* **Qualité attendue des liens** : Redirection ATS.
* **Exemple d’URL de recherche** : `https://api.smartrecruiters.com/v1/companies/LeroyMerlin/postings`
* **Remarque technique** : Permet de capter d'excellentes offres en Île-de-France (sièges et magasins).

#### 6. Canal+ Group (Média / Telecom)
* **Site carrière** : `https://recrutement.canalplus.com/`
* **Type de plateforme** : SmartRecruiters (slug : `CanalPlusGroup`)
* **Sans navigateur ?** Oui.
* **Niveau d’intégration** : Facile.
* **Contrats** : Stage, Alternance, CDI, VIE.
* **Qualité attendue des liens** : Redirection ATS.
* **Exemple d’URL de recherche** : `https://api.smartrecruiters.com/v1/companies/CanalPlusGroup/postings`
* **Remarque technique** : Offres à forte valeur ajoutée en école de commerce et ingénieurs. Les titres des offres sont généralement très explicites (par exemple : "STAGE - Assistant Chef de Projet").

#### 7. Kiabi (Retail / Mode)
* **Site carrière** : `https://careers.kiabi.com/`
* **Type de plateforme** : SmartRecruiters (slug : `Kiabi`)
* **Sans navigateur ?** Oui.
* **Niveau d’intégration** : Facile.
* **Contrats** : Stage, Alternance, CDI, Job Étudiant.
* **Qualité attendue des liens** : Redirection ATS.
* **Exemple d’URL de recherche** : `https://api.smartrecruiters.com/v1/companies/Kiabi/postings`
* **Remarque technique** : Source d'offres récurrentes de stage et d'alternance sur toute la France.

#### 8. BlaBlaCar (Tech / Transport)
* **Site carrière** : `https://www.blablacar.com/about-us/careers`
* **Type de plateforme** : Greenhouse (slug : `blablacar`)
* **Sans navigateur ?** Oui (API REST publique).
* **Niveau d’intégration** : Facile.
* **Contrats** : Stage, Alternance, CDI.
* **Qualité attendue des liens** : Lien direct (ex : `https://boards.greenhouse.io/blablacar/jobs/123456`).
* **Exemple d’URL de recherche** : `https://boards-api.greenhouse.io/v1/boards/blablacar/jobs?content=true`
* **Remarque technique** : Le paramètre `content=true` est critique : il renvoie l'intégralité du contenu de l'offre (description complète) directement dans le JSON d'indexation, évitant des requêtes individuelles par offre.

#### 9. Back Market (Tech / E-commerce)
* **Site carrière** : `https://www.backmarket.com/fr-fr/c/careers`
* **Type de plateforme** : Greenhouse (slug : `backmarket`)
* **Sans navigateur ?** Oui (API REST).
* **Niveau d’intégration** : Facile.
* **Contrats** : Stage, Alternance, CDI.
* **Qualité attendue des liens** : Lien direct.
* **Exemple d’URL de recherche** : `https://boards-api.greenhouse.io/v1/boards/backmarket/jobs?content=true`
* **Remarque technique** : Les offres d'alternance ou de stage pour développeurs ou analystes y sont très bien structurées.

#### 10. Swile (Tech / Fintech)
* **Site carrière** : `https://www.swile.co/careers`
* **Type de plateforme** : Greenhouse (slug : `swile`)
* **Sans navigateur ?** Oui.
* **Niveau d’intégration** : Facile.
* **Contrats** : Stage, Alternance, CDI.
* **Qualité attendue des liens** : Lien direct.
* **Exemple d’URL de recherche** : `https://boards-api.greenhouse.io/v1/boards/swile/jobs?content=true`
* **Remarque technique** : Très bonne source pour les étudiants recherchant des contrats dans des entreprises orientées "Tech".

#### 11. PayFit (Tech / RH)
* **Site carrière** : `https://payfit.com/careers/`
* **Type de plateforme** : Greenhouse (slug : `payfit`)
* **Sans navigateur ?** Oui.
* **Niveau d’intégration** : Facile.
* **Contrats** : Stage, Alternance, CDI.
* **Qualité attendue des liens** : Lien direct.
* **Exemple d’URL de recherche** : `https://boards-api.greenhouse.io/v1/boards/payfit/jobs?content=true`
* **Remarque technique** : Les offres intègrent des détails très clairs sur l'organisation du télétravail ou de l'hybride.

#### 12. Qonto (Tech / Fintech)
* **Site carrière** : `https://qonto.com/fr/careers`
* **Type de plateforme** : Lever (slug : `qonto`)
* **Sans navigateur ?** Oui (API publique).
* **Niveau d’intégration** : Facile.
* **Contrats** : Stage, Alternance, CDI.
* **Qualité attendue des liens** : Lien direct (`https://jobs.lever.co/qonto/uuid`).
* **Exemple d’URL de recherche** : `https://api.lever.co/v0/postings/qonto?mode=json`
* **Remarque technique** : L'API publique de Lever renvoie un format JSON direct et d'une structure extrêmement simple à parser sous Node.js.

#### 13. Airbus (Aéronautique / Défense)
* **Site carrière** : `https://www.airbus.com/en/careers`
* **Type de plateforme** : Workday (tenant : `airbus`, site_id : `Airbus`)
* **Sans navigateur ?** Oui (API interne par requête POST).
* **Niveau d’intégration** : Moyen.
* **Contrats** : Alternance, Stage, CDI, VIE.
* **Qualité attendue des liens** : Redirection ATS.
* **Exemple d’URL de recherche** : `https://airbus.wd3.myworkdayjobs.com/wday/cxs/airbus/Airbus/jobs`
* **Remarque technique** : Pour interroger Workday sans navigateur, il faut envoyer une requête HTTP **POST** avec un payload JSON `{ "limit": 20, "offset": 0, "searchText": "", "appliedFacets": {} }`. La pagination doit s'incrémenter via le champ `offset`.

#### 14. TotalEnergies (Énergie)
* **Site carrière** : `https://totalenergies.com/fr/carrieres`
* **Type de plateforme** : Workday (tenant : `totalenergies`, site_id : `TotalEnergies_Careers`)
* **Sans navigateur ?** Oui (POST JSON).
* **Niveau d’intégration** : Moyen.
* **Contrats** : Alternance, Stage, CDI, CDD, VIE.
* **Qualité attendue des liens** : Redirection ATS.
* **Exemple d’URL de recherche** : `https://totalenergies.wd3.myworkdayjobs.com/wday/cxs/totalenergies/TotalEnergies_Careers/jobs`
* **Remarque technique** : Airbus et TotalEnergies partagent la même structure d'API. Vous pouvez écrire une seule fonction générique en TypeScript pour gérer tous les sites carrières Workday.

#### 15. Sanofi (Pharmacie / Santé)
* **Site carrière** : `https://www.sanofi.fr/fr/carrieres`
* **Type de plateforme** : Workday (tenant : `sanofi`, site_id : `SanofiCareers`)
* **Sans navigateur ?** Oui (POST JSON).
* **Niveau d’intégration** : Moyen.
* **Contrats** : Alternance, Stage, CDI, VIE.
* **Qualité attendue des liens** : Redirection ATS.
* **Exemple d’URL de recherche** : `https://sanofi.wd3.myworkdayjobs.com/wday/cxs/sanofi/SanofiCareers/jobs`
* **Remarque technique** : Grand recruteur d'alternants dans le domaine de la data, de l'IT et de la recherche en santé.

#### 16. Forvis Mazars (Audit / Conseil)
* **Site carrière** : `https://recrutement.mazars.fr/`
* **Type de plateforme** : Workday (tenant : `mazars`, site_id : `External`)
* **Sans navigateur ?** Oui (POST JSON).
* **Niveau d’intégration** : Moyen.
* **Contrats** : Stage, Alternance, CDI, VIE.
* **Qualité attendue des liens** : Redirection ATS.
* **Exemple d’URL de recherche** : `https://mazars.wd3.myworkdayjobs.com/wday/cxs/mazars/External/jobs`
* **Remarque technique** : Cabinet phare pour les stages de fin d'études ("pré-embauche") en Île-de-France.

#### 17. Société Générale (Banque)
* **Site carrière** : `https://careers.societegenerale.com/`
* **Type de plateforme** : Phenom People (couche de présentation sur backend interne)
* **Sans navigateur ?** Oui (API interne).
* **Niveau d’intégration** : Moyen.
* **Contrats** : Alternance, Stage, CDI, VIE, Job Étudiant.
* **Qualité attendue des liens** : Redirection ATS.
* **Exemple d’URL de recherche** : Point d'API interne détecté dans la console réseau de type `https://careers.societegenerale.com/apis/v1/jobs` (ou `societegenerale.phenompeople.com/apis/jobs`).
* **Remarque technique** : Phenom People offre une API de recherche interne qui renvoie du JSON d'excellente qualité. Il faut intercepter la requête via l'onglet Network pour extraire l'URL exacte et le Header de requête (généralement sans jeton complexe, juste un User-Agent valide).

#### 18. L'Oréal (Luxe / Cosmétique)
* **Site carrière** : `https://careers.loreal.com/`
* **Type de plateforme** : Phenom People + Avature
* **Sans navigateur ?** Oui (API interne).
* **Niveau d’intégration** : Moyen.
* **Contrats** : Stage, Alternance, CDI, VIE.
* **Qualité attendue des liens** : Redirection ATS.
* **Exemple d’URL de recherche** : Point d'API interne du site `careers.loreal.com`.
* **Remarque technique** : Même typologie de récupération que pour la Société Générale. Les "Management Trainee Programs" pour jeunes diplômés y sont très bien référencés.

#### 19. AXA France (Assurance)
* **Site carrière** : `https://recrutement.axa.fr/`
* **Type de plateforme** : Phenom People
* **Sans navigateur ?** Oui (API interne).
* **Niveau d’intégration** : Moyen.
* **Contrats** : Alternance, Stage, CDI, VIE.
* **Qualité attendue des liens** : Redirection ATS.
* **Exemple d’URL de recherche** : Point d'API interne sous le domaine `recrutement.axa.fr`.
* **Remarque technique** : AXA dispose de volumes impressionnants d'offres en alternance en Île-de-France (Tech, actuariat, gestion).

#### 20. Capgemini (ESN / Conseil)
* **Site carrière** : `https://www.capgemini.com/fr-fr/carrieres/`
* **Type de plateforme** : SAP SuccessFactors
* **Sans navigateur ?** Oui (flux OData / JSON).
* **Niveau d’intégration** : Moyen.
* **Contrats** : Alternance, Stage, CDI, VIE.
* **Qualité attendue des liens** : Redirection ATS (`https://career5.successfactors.eu/...`).
* **Exemple d’URL de recherche** : Requête de recherche interne du module Career Site Builder de SAP SuccessFactors.
* **Remarque technique** : SuccessFactors nécessite parfois de simuler une première requête GET pour récupérer un cookie de session (`JSESSIONID` / `route`) afin que les requêtes de recherche suivantes ne soient pas rejetées par le serveur.

---

### 3. Modèles de code TypeScript (Node.js) pour l’intégration

Voici deux exemples concrets en TypeScript pour vous faire gagner du temps sur l'implémentation des deux types d'ATS les plus fréquents de cette liste :

#### Option A : Intégration SmartRecruiters (ex: Ubisoft, Decathlon, Wavestone...)
```typescript
import axios from 'axios';

interface SmartRecruitersJob {
  id: string;
  name: string; // Titre du poste
  uuid: string;
  releasedDate: string;
  location: {
    city: string;
    region: string;
    country: string;
  };
  contractType: {
    id: string;
    name: string; // ex: "Permanent", "Internship", "Apprenticeship"
  };
}

// Fonction générique pour récupérer les offres d'un tenant SmartRecruiters
async function getSmartRecruitersJobs(companyId: string): Promise<SmartRecruitersJob[]> {
  try {
    const url = `https://api.smartrecruiters.com/v1/companies/${companyId}/postings`;
    const response = await axios.get<{ content: SmartRecruitersJob[] }>(url, {
      headers: { 'User-Agent': 'Job-Searcher-Bot/1.0' }
    });
    
    // On filtre uniquement pour la France (FR)
    const allJobs = response.data.content || [];
    return allJobs.filter(job => job.location.country.toLowerCase() === 'fr');
  } catch (error) {
    console.error(`Erreur SmartRecruiters pour ${companyId}:`, error);
    return [];
  }
}
```

#### Option B : Intégration Workday (ex: Airbus, TotalEnergies, Mazars...)
```typescript
import axios from 'axios';

interface WorkdayJob {
  title: string;
  externalPath: string; // Path relatif vers l'offre
  locationsText: string;
  postedOn: string;
}

interface WorkdayResponse {
  jobPostings: WorkdayJob[];
  total: number;
}

// Fonction générique pour Workday
async function getWorkdayJobs(tenant: string, boardId: string): Promise<WorkdayJob[]> {
  try {
    const url = `https://${tenant}.myworkdayjobs.com/wday/cxs/${tenant}/${boardId}/jobs`;
    
    const payload = {
      limit: 20,
      offset: 0,
      searchText: "France", // Filtre sur la France pour limiter les résultats
      appliedFacets: {}
    };

    const response = await axios.post<WorkdayResponse>(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    return response.data.jobPostings || [];
  } catch (error) {
    console.error(`Erreur Workday pour le tenant ${tenant}:`, error);
    return [];
  }
}
```

### 4. Sources bonus "faciles" : Teamtailor et Welcome to the Jungle
1. **Teamtailor** : Si vous repérez une entreprise en France utilisant Teamtailor, leur flux est d’une simplicité redoutable. Il suffit d'ajouter `.rss` à la fin de l'URL carrières (ex: `https://career.entreprise.com/jobs.rss`) et d'utiliser un parseur XML léger comme `rss-parser` sous Node.js pour extraire toutes les offres structurées.
2. **Welcome to the Jungle (WTTJ)** : Plutôt que de scraper le HTML, WTTJ utilise l'API **Algolia** en frontend pour faire tourner son moteur de recherche. En analysant les appels réseau (XHR) sur la page de recherche, vous pouvez extraire la clé publique Algolia et l'ID d'application (qui sont statiques dans leur code client). Cela vous permet d'effectuer des requêtes de recherche ultra-rapides, paginées et structurées directement depuis votre code TypeScript.