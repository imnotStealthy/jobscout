Pour répondre à vos besoins d’expansion pour le projet **Job Searcher**, voici une nouvelle sélection technique de **30 sources ATS** excluant totalement SmartRecruiters, Lever et Greenhouse. 

Cette liste se concentre sur des ATS très implantés en France et en Europe (**Recruitee, Workable, Personio, Teamtailor RSS, Ashby, Pinpoint**) ainsi que de nouveaux géants français sur **Workday** et **Phenom People**. Toutes ces sources ont la particularité d'exposer des points d'accès (endpoints) publics et structurés (JSON ou XML/RSS) exploitables directement en TypeScript sans navigateur headless.

---

### 1. Tableau comparatif des 30 nouvelles sources ATS

| N° | Entreprise | ATS Détecté | Slug / Tenant (Site ID) | Endpoint API Exact à Tester | Filtrable France | Contrats Probables | Niveau |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **1** | Eight Advisory | Recruitee | `eight-advisory-sas` | `https://eight-advisory-sas.recruitee.com/api/offers` | Côté Node | Stage, CDI, VIE | Facile |
| **2** | AMI Paris | Recruitee | `ami-paris` | `https://ami-paris.recruitee.com/api/offers` | Côté Node | Stage, Alternance, CDI | Facile |
| **3** | Mistertemp' Group | Recruitee | `mistertemp-group` | `https://mistertemp-group.recruitee.com/api/offers` | Côté Node | Alternance, CDI, CDD | Facile |
| **4** | Sellsy | Recruitee | `sellsy` | `https://sellsy.recruitee.com/api/offers` | Côté Node | Stage, Alternance, CDI | Facile |
| **5** | Asphalte | Recruitee | `asphalte` | `https://asphalte.recruitee.com/api/offers` | Côté Node | Stage, Alternance, CDI | Facile |
| **6** | Garantme | Recruitee | `garantme` | `https://garantme.recruitee.com/api/offers` | Côté Node | Stage, Alternance, CDI | Facile |
| **7** | Betclic Group | Workable | `betclic-group` | `https://apply.workable.com/api/v1/widget/accounts/betclic-group?details=true` | Côté Node | Stage, Alternance, CDI | Facile |
| **8** | Happn | Workable | `happn` | `https://apply.workable.com/api/v1/widget/accounts/happn?details=true` | Côté Node | Stage, Alternance, CDI | Facile |
| **9** | Sephora (LVMH) | Workable | `sephora` | `https://apply.workable.com/api/v1/widget/accounts/sephora?details=true` | Côté Node | Stage, Alternance, CDI | Facile |
| **10** | Shadow | Workable | `shadow` | `https://apply.workable.com/api/v1/widget/accounts/shadow?details=true` | Côté Node | Stage, Alternance, CDI | Facile |
| **11** | Balyo | Workable | `balyo` | `https://apply.workable.com/api/v1/widget/accounts/balyo?details=true` | Côté Node | Stage, Alternance, CDI | Facile |
| **12** | Urban Sports Club | Personio | `urbansportsclub` | `https://urbansportsclub.jobs.personio.de/xml?language=fr` | Côté Node | Stage, CDI, CDD | Facile |
| **13** | Egym | Personio | `egym` | `https://egym.jobs.personio.de/xml?language=fr` | Côté Node | Stage, Alternance, CDI | Facile |
| **14** | Taxfix | Personio | `taxfix` | `https://taxfix.jobs.personio.de/xml?language=fr` | Côté Node | Stage, CDI | Facile |
| **15** | Spryker | Personio | `spryker` | `https://spryker.jobs.personio.de/xml?language=fr` | Côté Node | Stage, CDI | Facile |
| **16** | Vercel | Ashby | `vercel` | `https://api.ashbyhq.com/posting-api/job-board/vercel?includeCompensation=true` | Côté Node | CDI (Remote FR) | Facile |
| **17** | Figma | Ashby | `figma` | `https://api.ashbyhq.com/posting-api/job-board/figma?includeCompensation=true` | Côté Node | CDI (FR/Europe) | Facile |
| **18** | Ramp | Ashby | `ramp` | `https://api.ashbyhq.com/posting-api/job-board/ramp?includeCompensation=true` | Côté Node | CDI (FR/Europe) | Facile |
| **19** | Linear | Ashby | `linear` | `https://api.ashbyhq.com/posting-api/job-board/linear?includeCompensation=true` | Côté Node | CDI (Remote FR) | Facile |
| **20** | Plaid | Ashby | `plaid` | `https://api.ashbyhq.com/posting-api/job-board/plaid?includeCompensation=true` | Côté Node | CDI (FR/Europe) | Facile |
| **21** | Kpler | Teamtailor | `kpler` | `https://kpler.teamtailor.com/jobs.rss` | Côté Node | Stage, Alternance, CDI | Facile |
| **22** | Luko | Teamtailor | `luko` | `https://luko.teamtailor.com/jobs.rss` | Côté Node | Stage, Alternance, CDI | Facile |
| **23** | Heuritech | Teamtailor | `heuritech` | `https://heuritech.teamtailor.com/jobs.rss` | Côté Node | Stage, Alternance, CDI | Facile |
| **24** | Inato | Teamtailor | `inato` | `https://inato.teamtailor.com/jobs.rss` | Côté Node | Stage, Alternance, CDI | Facile |
| **25** | CleverConnect | Teamtailor | `cleverconnect` | `https://cleverconnect.teamtailor.com/jobs.rss` | Côté Node | Stage, Alternance, CDI | Facile |
| **26** | Tripledot Studios | Pinpoint | `tripledotstudios` | `https://tripledotstudios.pinpointhq.com/postings.json` | Côté Node | Stage, CDI | Facile |
| **27** | SKIMS | Pinpoint | `skims` | `https://skims.pinpointhq.com/postings.json` | Côté Node | CDI (Paris/FR) | Facile |
| **28** | LVMH | Workday | `lvmh` (LVMH) | `https://lvmh.wd3.myworkdayjobs.com/wday/cxs/lvmh/LVMH/jobs` | Requête POST | Stage, Alternance, CDI, VIE | Moyen |
| **29** | Danone | Workday | `danone` (Danone_Careers) | `https://danone.wd3.myworkdayjobs.com/wday/cxs/danone/Danone_Careers/jobs` | Requête POST | Stage, Alternance, CDI, VIE | Moyen |
| **30** | Pernod Ricard | Workday | `pernodricard` (Pernod_Ricard) | `https://pernodricard.wd3.myworkdayjobs.com/wday/cxs/pernodricard/Pernod_Ricard/jobs` | Requête POST | Stage, Alternance, CDI, VIE | Moyen |

---

### 2. Short-list détaillée des 30 sources (classées par ATS)

#### Famille d'ATS : Recruitee (GET - JSON public)
*L'endpoint renvoie directement un tableau JSON contenant les offres actives. Filtrage géographique à appliquer côté Node en inspectant l'objet `location`.*

##### 1. Eight Advisory
* **Site carrière officiel** : `https://www.8advisory.com/`
* **ATS détecté** : Recruitee
* **Slug exact** : `eight-advisory-sas`
* **Endpoint API** : `https://eight-advisory-sas.recruitee.com/api/offers`
* **Exemple d’URL API** : `https://eight-advisory-sas.recruitee.com/api/offers`
* **Pays/France filtrable** : Côté Node (inspecter `location.country === "France"` ou `location.city === "Paris"`).
* **Types de contrats probables** : Stage, CDI, VIE.
* **Niveau d’intégration** : Facile.
* **Pertinence** : Cabinet financier de premier plan à Paris, particulièrement prisé pour les stages de fin d'études en transaction services ou restructuration.

##### 2. AMI Paris
* **Site carrière officiel** : `https://amiparis.com/`
* **ATS détecté** : Recruitee
* **Slug exact** : `ami-paris`
* **Endpoint API** : `https://ami-paris.recruitee.com/api/offers`
* **Exemple d’URL API** : `https://ami-paris.recruitee.com/api/offers`
* **Pays/France filtrable** : Côté Node.
* **Types de contrats probables** : Stage, Alternance, CDI.
* **Niveau d’intégration** : Facile.
* **Pertinence** : Acteur de premier plan du prêt-à-porter de luxe parisien, recherchant des profils en logistique, e-commerce et création.

##### 3. Mistertemp' Group
* **Site carrière officiel** : `https://www.mistertemp-group.com/`
* **ATS détecté** : Recruitee
* **Slug exact** : `mistertemp-group`
* **Endpoint API** : `https://mistertemp-group.recruitee.com/api/offers`
* **Exemple d’URL API** : `https://mistertemp-group.recruitee.com/api/offers`
* **Pays/France filtrable** : Côté Node.
* **Types de contrats probables** : Alternance, CDI, CDD.
* **Niveau d’intégration** : Facile.
* **Pertinence** : Scale-up RH (French Tech 120), idéal pour l'insertion de jeunes diplômés en gestion de comptes et recrutement digital.

##### 4. Sellsy
* **Site carrière officiel** : `https://sellsy.com/`
* **ATS détecté** : Recruitee
* **Slug exact** : `sellsy`
* **Endpoint API** : `https://sellsy.recruitee.com/api/offers`
* **Exemple d’URL API** : `https://sellsy.recruitee.com/api/offers`
* **Pays/France filtrable** : Côté Node.
* **Types de contrats probables** : Stage, Alternance, CDI.
* **Niveau d’intégration** : Facile.
* **Pertinence** : Éditeur CRM majeur basé à La Rochelle, proposant des contrats à impact pour les étudiants en tech hors Île-de-France.

##### 5. Asphalte
* **Site carrière officiel** : `https://asphalte.com/`
* **ATS détecté** : Recruitee
* **Slug exact** : `asphalte`
* **Endpoint API** : `https://asphalte.recruitee.com/api/offers`
* **Exemple d’URL API** : `https://asphalte.recruitee.com/api/offers`
* **Pays/France filtrable** : Côté Node.
* **Types de contrats probables** : Stage, Alternance, CDI.
* **Niveau d’intégration** : Facile.
* **Pertinence** : Marque e-commerce écoresponsable en pleine expansion, proposant régulièrement des stages en marketing et relation client.

##### 6. Garantme
* **Site carrière officiel** : `https://garantme.fr/`
* **ATS détecté** : Recruitee
* **Slug exact** : `garantme`
* **Endpoint API** : `https://garantme.recruitee.com/api/offers`
* **Exemple d’URL API** : `https://garantme.recruitee.com/api/offers`
* **Pays/France filtrable** : Côté Node.
* **Types de contrats probables** : Stage, Alternance, CDI.
* **Niveau d’intégration** : Facile.
* **Pertinence** : Insurtech française en croissance constante, recrutant des jeunes commerciaux (SDR) et des gestionnaires d'opérations.

---

#### Famille d'ATS : Workable (GET - JSON public)
*L'API widget de Workable est accessible sans jeton et renvoie la totalité des postes ouverts.*

##### 7. Betclic Group
* **Site carrière officiel** : `https://www.betclicgroup.com/`
* **ATS détecté** : Workable
* **Slug exact** : `betclic-group`
* **Endpoint API** : `https://apply.workable.com/api/v1/widget/accounts/betclic-group?details=true`
* **Exemple d’URL API** : `https://apply.workable.com/api/v1/widget/accounts/betclic-group?details=true`
* **Pays/France filtrable** : Côté Node (vérifier `location.country === "France"`).
* **Types de contrats probables** : Stage, Alternance, CDI.
* **Niveau d’intégration** : Facile.
* **Pertinence** : Siège principal à Bordeaux, haut volume de recrutement de profils digitaux (data, UX, développement) juniors.

##### 8. Happn
* **Site carrière officiel** : `https://www.happn.com/`
* **ATS détecté** : Workable
* **Slug exact** : `happn`
* **Endpoint API** : `https://apply.workable.com/api/v1/widget/accounts/happn?details=true`
* **Exemple d’URL API** : `https://apply.workable.com/api/v1/widget/accounts/happn?details=true`
* **Pays/France filtrable** : Côté Node.
* **Types de contrats probables** : Stage, Alternance, CDI.
* **Niveau d’intégration** : Facile.
* **Pertinence** : Acteur historique de l'écosystème mobile parisien, proposant des stages techniques et produits recherchés.

##### 9. Sephora
* **Site carrière officiel** : `https://www.sephora.com/`
* **ATS détecté** : Workable
* **Slug exact** : `sephora`
* **Endpoint API** : `https://apply.workable.com/api/v1/widget/accounts/sephora?details=true`
* **Exemple d’URL API** : `https://apply.workable.com/api/v1/widget/accounts/sephora?details=true`
* **Pays/France filtrable** : Côté Node.
* **Types de contrats probables** : Stage, Alternance, CDI.
* **Niveau d’intégration** : Facile.
* **Pertinence** : Division retail majeure de LVMH, idéale pour les stages en Category Management, supply chain et finance à Neuilly-sur-Seine.

##### 10. Shadow
* **Site carrière officiel** : `https://shadow.tech/`
* **ATS détecté** : Workable
* **Slug exact** : `shadow`
* **Endpoint API** : `https://apply.workable.com/api/v1/widget/accounts/shadow?details=true`
* **Exemple d’URL API** : `https://apply.workable.com/api/v1/widget/accounts/shadow?details=true`
* **Pays/France filtrable** : Côté Node.
* **Types de contrats probables** : Stage, Alternance, CDI.
* **Niveau d’intégration** : Facile.
* **Pertinence** : Fleuron technologique français du cloud-computing proposant des projets R&D avancés.

##### 11. Balyo
* **Site carrière officiel** : `https://www.balyo.fr/`
* **ATS détecté** : Workable
* **Slug exact** : `balyo`
* **Endpoint API** : `https://apply.workable.com/api/v1/widget/accounts/balyo?details=true`
* **Exemple d’URL API** : `https://apply.workable.com/api/v1/widget/accounts/balyo?details=true`
* **Pays/France filtrable** : Côté Node.
* **Types de contrats probables** : Stage, Alternance, CDI.
* **Niveau d’intégration** : Facile.
* **Pertinence** : Expert de la robotique industrielle de manutention, recrute des profils d'ingénieurs en robotique et automatisme.

---

#### Famille d'ATS : Personio (GET - XML public)
*Personio expose un flux XML d'offres d'emploi. L'ajout du paramètre `language=fr` permet de forcer la langue des descriptions.*

##### 12. Urban Sports Club
* **Site carrière officiel** : `https://urbansportsclub.com/`
* **ATS détecté** : Personio
* **Slug exact** : `urbansportsclub`
* **Endpoint API** : `https://urbansportsclub.jobs.personio.de/xml?language=fr`
* **Exemple d’URL API** : `https://urbansportsclub.jobs.personio.de/xml?language=fr`
* **Pays/France filtrable** : Côté Node (lire les tags XML `<office>` ou `<country>`).
* **Types de contrats probables** : Stage, CDI, CDD.
* **Niveau d’intégration** : Facile.
* **Pertinence** : Solution de fitness multi-salles, d'excellentes opportunités dans les équipes commerciales et opérations à Paris.

##### 13. Egym
* **Site carrière officiel** : `https://egym.com/`
* **ATS détecté** : Personio
* **Slug exact** : `egym`
* **Endpoint API** : `https://egym.jobs.personio.de/xml?language=fr`
* **Exemple d’URL API** : `https://egym.jobs.personio.de/xml?language=fr`
* **Pays/France filtrable** : Côté Node.
* **Types de contrats probables** : Stage, Alternance, CDI.
* **Niveau d’intégration** : Facile.
* **Pertinence** : Medtech et fitness connecté en forte croissance, idéal pour les profils orientés ingénierie biomédicale ou commerciale.

##### 14. Taxfix
* **Site carrière officiel** : `https://taxfix.de/`
* **ATS détecté** : Personio
* **Slug exact** : `taxfix`
* **Endpoint API** : `https://taxfix.jobs.personio.de/xml?language=fr`
* **Exemple d’URL API** : `https://taxfix.jobs.personio.de/xml?language=fr`
* **Pays/France filtrable** : Côté Node.
* **Types de contrats probables** : Stage, CDI.
* **Niveau d’intégration** : Facile.
* **Pertinence** : Fintech phare en Europe continentale proposant des stages hautement formateurs dans l'administration fiscale numérique.

##### 15. Spryker
* **Site carrière officiel** : `https://spryker.com/`
* **ATS détecté** : Personio
* **Slug exact** : `spryker`
* **Endpoint API** : `https://spryker.jobs.personio.de/xml?language=fr`
* **Exemple d’URL API** : `https://spryker.jobs.personio.de/xml?language=fr`
* **Pays/France filtrable** : Côté Node.
* **Types de contrats probables** : Stage, CDI.
* **Niveau d’intégration** : Facile.
* **Pertinence** : Éditeur e-commerce en forte croissance, proposant des postes d'avant-vente ou d'implémentation SaaS ouverts aux profils juniors.

---

#### Famille d'ATS : Ashby (GET - JSON public)
*La plateforme Ashby s’impose de plus en plus comme l’outil moderne pour les entreprises d'ingénierie et d’outils SaaS.*

##### 16. Vercel
* **Site carrière officiel** : `https://vercel.com/`
* **ATS détecté** : Ashby
* **Slug exact** : `vercel`
* **Endpoint API** : `https://api.ashbyhq.com/posting-api/job-board/vercel?includeCompensation=true`
* **Exemple d’URL API** : `https://api.ashbyhq.com/posting-api/job-board/vercel?includeCompensation=true`
* **Pays/France filtrable** : Côté Node (analyser `location` et `secondaryLocations` pour détecter la mention "France" ou "Remote").
* **Types de contrats probables** : CDI (avec option télétravail total en France).
* **Niveau d’intégration** : Facile.
* **Pertinence** : Référence mondiale du Cloud et du framework Next.js. Opportunités de premier plan pour des diplômés de haut vol en informatique.

##### 17. Figma
* **Site carrière officiel** : `https://www.figma.com/`
* **ATS détecté** : Ashby
* **Slug exact** : `figma`
* **Endpoint API** : `https://api.ashbyhq.com/posting-api/job-board/figma?includeCompensation=true`
* **Exemple d’URL API** : `https://api.ashbyhq.com/posting-api/job-board/figma?includeCompensation=true`
* **Pays/France filtrable** : Côté Node.
* **Types de contrats probables** : CDI (FR/Europe).
* **Niveau d’intégration** : Facile.
* **Pertinence** : Leader mondial du design collaboratif, idéal pour s'insérer dans l'industrie du produit et du design d'interface.

##### 18. Ramp
* **Site carrière officiel** : `https://ramp.com/`
* **ATS détecté** : Ashby
* **Slug exact** : `ramp`
* **Endpoint API** : `https://api.ashbyhq.com/posting-api/job-board/ramp?includeCompensation=true`
* **Exemple d’URL API** : `https://api.ashbyhq.com/posting-api/job-board/ramp?includeCompensation=true`
* **Pays/France filtrable** : Côté Node.
* **Types de contrats probables** : CDI (FR/Europe).
* **Niveau d’intégration** : Facile.
* **Pertinence** : Fintech B2B à croissance ultra-rapide, recherchée par les étudiants en finance quantitative et data engineering.

##### 19. Linear
* **Site carrière officiel** : `https://linear.app/`
* **ATS détecté** : Ashby
* **Slug exact** : `linear`
* **Endpoint API** : `https://api.ashbyhq.com/posting-api/job-board/linear?includeCompensation=true`
* **Exemple d’URL API** : `https://api.ashbyhq.com/posting-api/job-board/linear?includeCompensation=true`
* **Pays/France filtrable** : Côté Node.
* **Types de contrats probables** : CDI (Remote FR).
* **Niveau d’intégration** : Facile.
* **Pertinence** : Outil standard de gestion de projets d'ingénierie moderne, pertinent pour les profils Produit/Tech.

##### 20. Plaid
* **Site carrière officiel** : `https://plaid.com/`
* **ATS détecté** : Ashby
* **Slug exact** : `plaid`
* **Endpoint API** : `https://api.ashbyhq.com/posting-api/job-board/plaid?includeCompensation=true`
* **Exemple d’URL API** : `https://api.ashbyhq.com/posting-api/job-board/plaid?includeCompensation=true`
* **Pays/France filtrable** : Côté Node.
* **Types de contrats probables** : CDI (FR/Europe).
* **Niveau d’intégration** : Facile.
* **Pertinence** : Licorne de l'Open Banking et des API financières, excellent accélérateur de carrière pour jeunes diplômés.

---

#### Famille d'ATS : Teamtailor (GET - XML/RSS public)
*L'ajout de l'extension `.rss` à l'URL racine de Teamtailor d'une entreprise permet de consommer son flux en continu.*

##### 21. Kpler
* **Site carrière officiel** : `https://www.kpler.com/`
* **ATS détecté** : Teamtailor
* **Slug exact** : `kpler`
* **Endpoint API** : `https://kpler.teamtailor.com/jobs.rss`
* **Exemple d’URL API** : `https://kpler.teamtailor.com/jobs.rss`
* **Pays/France filtrable** : Côté Node.
* **Types de contrats probables** : Stage, Alternance, CDI.
* **Niveau d’intégration** : Facile.
* **Pertinence** : Fleuron de l'analyse de données énergétiques et maritimes à Paris (French Tech 120), très recherché par les jeunes analystes.

##### 22. Luko
* **Site carrière officiel** : `https://luko.eu/`
* **ATS détecté** : Teamtailor
* **Slug exact** : `luko`
* **Endpoint API** : `https://luko.teamtailor.com/jobs.rss`
* **Exemple d’URL API** : `https://luko.teamtailor.com/jobs.rss`
* **Pays/France filtrable** : Côté Node.
* **Types de contrats probables** : Stage, Alternance, CDI.
* **Niveau d’intégration** : Facile.
* **Pertinence** : Assureur d'habitation digitalisé à Paris, idéal pour les profils juniors en actuariat, marketing et support client.

##### 23. Heuritech
* **Site carrière officiel** : `https://www.heuritech.com/`
* **ATS détecté** : Teamtailor
* **Slug exact** : `heuritech`
* **Endpoint API** : `https://heuritech.teamtailor.com/jobs.rss`
* **Exemple d’URL API** : `https://heuritech.teamtailor.com/jobs.rss`
* **Pays/France filtrable** : Côté Node.
* **Types de contrats probables** : Stage, Alternance, CDI.
* **Niveau d’intégration** : Facile.
* **Pertinence** : Start-up IA spécialisée dans la prédiction de tendances de mode, parfait pour des stages en Deep Learning et Data Science.

##### 24. Inato
* **Site carrière officiel** : `https://inato.com/`
* **ATS détecté** : Teamtailor
* **Slug exact** : `inato`
* **Endpoint API** : `https://inato.teamtailor.com/jobs.rss`
* **Exemple d’URL API** : `https://inato.teamtailor.com/jobs.rss`
* **Pays/France filtrable** : Côté Node.
* **Types de contrats probables** : Stage, Alternance, CDI.
* **Niveau d’intégration** : Facile.
* **Pertinence** : Plateforme d'essais cliniques, pertinente pour les profils biostatisques ou d'ingénieurs logiciels d'impact.

##### 25. CleverConnect (Meteojob / Visiotalent)
* **Site carrière officiel** : `https://www.cleverconnect.com/`
* **ATS détecté** : Teamtailor
* **Slug exact** : `cleverconnect`
* **Endpoint API** : `https://cleverconnect.teamtailor.com/jobs.rss`
* **Exemple d’URL API** : `https://cleverconnect.teamtailor.com/jobs.rss`
* **Pays/France filtrable** : Côté Node.
* **Types de contrats probables** : Stage, Alternance, CDI.
* **Niveau d’intégration** : Facile.
* **Pertinence** : Acteur central des technologies de recrutement et d'entretien vidéo, d'importantes perspectives en tech et RH.

---

#### Famille d'ATS : Pinpoint (GET - JSON public)
*Cet outil montant auprès des éditeurs de jeux vidéo et d'e-commerce expose ses offres à l’adresse `postings.json`.*

##### 26. Tripledot Studios
* **Site carrière officiel** : `https://tripledotstudios.com/`
* **ATS détecté** : Pinpoint
* **Slug exact** : `tripledotstudios`
* **Endpoint API** : `https://tripledotstudios.pinpointhq.com/postings.json`
* **Exemple d’URL API** : `https://tripledotstudios.pinpointhq.com/postings.json`
* **Pays/France filtrable** : Côté Node (parcourir la liste `locations` ou la clé `city`).
* **Types de contrats probables** : Stage, CDI.
* **Niveau d’intégration** : Facile.
* **Pertinence** : Studio d'édition de jeux mobiles, recherché pour ses stages en développement de jeux et UX design.

##### 27. SKIMS
* **Site carrière officiel** : `https://skims.com/`
* **ATS détecté** : Pinpoint
* **Slug exact** : `skims`
* **Endpoint API** : `https://skims.pinpointhq.com/postings.json`
* **Exemple d’URL API** : `https://skims.pinpointhq.com/postings.json`
* **Pays/France filtrable** : Côté Node.
* **Types de contrats probables** : CDI (Paris/FR).
* **Niveau d’intégration** : Facile.
* **Pertinence** : Acteur global du e-commerce de mode étendant son implantation retail et logistique en Europe.

---

#### Familles d'ATS : Workday & Phenom People (POST / GET interne)
*Pour ces géants de l'industrie et du luxe, la récupération sans navigateur est possible en reproduisant la méthode POST ou en consommant les API de données de Phenom People.*

##### 28. LVMH
* **Site carrière officiel** : `https://www.lvmh.com/fr/talents/rejoindre-lvmh/`
* **ATS détecté** : Workday
* **Slug / Tenant** : `lvmh` (SiteId : `LVMH`)
* **Endpoint API** : `https://lvmh.wd3.myworkdayjobs.com/wday/cxs/lvmh/LVMH/jobs`
* **Exemple d’URL API** : Requête POST vers `https://lvmh.wd3.myworkdayjobs.com/wday/cxs/lvmh/LVMH/jobs` avec le corps `{ "limit": 20, "offset": 0, "searchText": "France" }`
* **Pays/France filtrable** : Oui (via le paramètre `searchText`).
* **Types de contrats probables** : Stage, Alternance, CDI, VIE.
* **Niveau d’intégration** : Moyen.
* **Pertinence** : Leader mondial du luxe et premier employeur d'internes et d'alternants juniors à Paris en marketing, digital et finance.

##### 29. Danone
* **Site carrière officiel** : `https://careers.danone.com/`
* **ATS détecté** : Workday
* **Slug / Tenant** : `danone` (SiteId : `Danone_Careers`)
* **Endpoint API** : `https://danone.wd3.myworkdayjobs.com/wday/cxs/danone/Danone_Careers/jobs`
* **Exemple d’URL API** : Requête POST similaire avec `danone` et `Danone_Careers`.
* **Pays/France filtrable** : Oui.
* **Types de contrats probables** : Stage, Alternance, CDI, VIE.
* **Niveau d’intégration** : Moyen.
* **Pertinence** : Enorme volume d’opportunités de stages en usine, en fonctions supports et en gestion de marque agroalimentaire.

##### 30. Pernod Ricard
* **Site carrière officiel** : `https://www.pernod-ricard.com/fr/carrieres/nous-rejoindre`
* **ATS détecté** : Workday
* **Slug / Tenant** : `pernodricard` (SiteId : `Pernod_Ricard`)
* **Endpoint API** : `https://pernodricard.wd3.myworkdayjobs.com/wday/cxs/pernodricard/Pernod_Ricard/jobs`
* **Exemple d’URL API** : Requête POST similaire.
* **Pays/France filtrable** : Oui.
* **Types de contrats probables** : Stage, Alternance, CDI, VIE.
* **Niveau d’intégration** : Moyen.
* **Pertinence** : Groupe mondial du secteur des vins et spiritueux, très actif sur le VIE et le recrutement de stagiaires ingénieurs ou commerciaux.

---

### 3. Exemples techniques en TypeScript (Node.js)

Le script suivant illustre comment interroger deux de ces nouveaux types d’ATS sans authentification :

```typescript
import axios from 'axios';

// 1. Appel d'une source Recruitee (Asphalte, Garantme, Sellsy, Eight Advisory...)
interface RecruiteeJob {
  id: number;
  title: string;
  country: string;
  city: string;
  careers_url: string;
}

async function fetchRecruitee(slug: string): Promise<RecruiteeJob[]> {
  const url = `https://${slug}.recruitee.com/api/offers`;
  const response = await axios.get<{ offers: RecruiteeJob[] }>(url, {
    headers: { 'User-Agent': 'Job-Searcher-Bot/1.0' }
  });
  
  // On filtre en local sur la France (FR)
  return (response.data.offers || []).filter(
    job => job.country?.toLowerCase() === 'france' || job.city?.toLowerCase() === 'paris'
  );
}

// 2. Appel d'une source Workable (Happn, Betclic, Sephora...)
interface WorkableJob {
  shortcode: string;
  title: string;
  country: string;
  city: string;
}

async function fetchWorkable(slug: string): Promise<WorkableJob[]> {
  // apply.workable.com est le point d'entrée public pour les widgets
  const url = `https://apply.workable.com/api/v1/widget/accounts/${slug}?details=true`;
  const response = await axios.get<{ jobs: WorkableJob[] }>(url, {
    headers: { 'User-Agent': 'Job-Searcher-Bot/1.0' }
  });
  
  return (response.data.jobs || []).filter(
    job => job.country?.toLowerCase() === 'france'
  );
}
```