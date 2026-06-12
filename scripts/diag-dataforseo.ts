// Validation manuelle du filtrage trusted DataForSEO — aucun appel réseau,
// aucun secret affiché. Usage: node --env-file=.env --import tsx scripts/diag-dataforseo.ts
import { loadConfig } from "../src/config.js";
import { toFtOffer } from "../src/dataforseoClient.js";

const cfg = loadConfig();
console.log(`trustedHosts: ${cfg.trustedHosts.length} entrées | excludedHosts: ${cfg.excludedHosts.length} entrées`);

const mixed = {
  title: "Chef de projet transformation digitale",
  employer_name: "ACME",
  location: "Paris",
  apply_options: [
    { source: "LinkedIn", url: "https://fr.linkedin.com/jobs/view/123" },
    { source: "Indeed", url: "https://fr.indeed.com/viewjob?jk=456" },
    { source: "Greenhouse", url: "https://boards.greenhouse.io/acme/jobs/789" },
  ],
};
const untrustedOnly = {
  title: "Chef de projet",
  apply_options: [
    { source: "LinkedIn", url: "https://fr.linkedin.com/jobs/view/123" },
    { source: "Indeed", url: "https://fr.indeed.com/viewjob?jk=456" },
  ],
};

const kept = toFtOffer(mixed, cfg);
console.log("mix LinkedIn/Indeed/Greenhouse ->", kept?.origineOffre?.urlOrigine ?? "DROP");
console.assert(kept?.origineOffre?.urlOrigine === "https://boards.greenhouse.io/acme/jobs/789", "FAIL: Greenhouse attendu");

const dropped = toFtOffer(untrustedOnly, cfg);
console.log("LinkedIn/Indeed uniquement ->", dropped === null ? "DROP (attendu)" : "FAIL: aurait dû être drop");
console.assert(dropped === null, "FAIL: offre non fiable conservée");

console.log("Validation OK");
