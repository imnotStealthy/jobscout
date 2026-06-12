import { describe, expect, it } from "vitest";
import { isTrustedGoogleJobsUrl, pickTrustedApplyUrl, toFtOffer, HostRules } from "./dataforseoClient.js";
import { isTrustedHost } from "./hostFilter.js";

const CFG: HostRules = {
  excludedHosts: ["linkedin.com", "indeed", "glassdoor"],
  trustedHosts: ["greenhouse.io", "lever.co", "workable.com"],
};

describe("isTrustedHost", () => {
  it("accepte les sous-domaines d'un domaine de confiance", () => {
    expect(isTrustedHost("jobs.lever.co", ["lever.co"])).toBe(true);
    expect(isTrustedHost("company.greenhouse.io", ["greenhouse.io"])).toBe(true);
  });
  it("refuse les domaines lookalike et le host nul", () => {
    expect(isTrustedHost("evil-lever.co", ["lever.co"])).toBe(false);
    expect(isTrustedHost(null, ["lever.co"])).toBe(false);
  });
});

describe("isTrustedGoogleJobsUrl", () => {
  it("refuse LinkedIn, Indeed et Google", () => {
    expect(isTrustedGoogleJobsUrl("https://fr.linkedin.com/jobs/view/1", CFG)).toBe(false);
    expect(isTrustedGoogleJobsUrl("https://fr.indeed.com/viewjob?jk=1", CFG)).toBe(false);
    expect(isTrustedGoogleJobsUrl("https://www.google.com/search?ibp=htl;jobs", CFG)).toBe(false);
  });
  it("refuse URL absente ou invalide", () => {
    expect(isTrustedGoogleJobsUrl(null, CFG)).toBe(false);
    expect(isTrustedGoogleJobsUrl("not a url", CFG)).toBe(false);
  });
  it("accepte Greenhouse / Lever / Workable", () => {
    expect(isTrustedGoogleJobsUrl("https://boards.greenhouse.io/acme/jobs/1", CFG)).toBe(true);
    expect(isTrustedGoogleJobsUrl("https://jobs.lever.co/acme/1", CFG)).toBe(true);
    expect(isTrustedGoogleJobsUrl("https://apply.workable.com/acme/j/1", CFG)).toBe(true);
  });
});

describe("mapping DataForSEO", () => {
  it("choisit la première apply option fiable", () => {
    const item = {
      title: "Chef de projet",
      apply_options: [
        { source: "LinkedIn", url: "https://fr.linkedin.com/jobs/view/1" },
        { source: "Indeed", url: "https://fr.indeed.com/viewjob?jk=1" },
        { source: "Greenhouse", url: "https://boards.greenhouse.io/acme/jobs/1" },
      ],
    };
    expect(pickTrustedApplyUrl(item, CFG)).toBe("https://boards.greenhouse.io/acme/jobs/1");
    const offer = toFtOffer(item, CFG);
    expect(offer?.origineOffre?.urlOrigine).toBe("https://boards.greenhouse.io/acme/jobs/1");
    expect(offer?.id).toBe("dataforseo:https://boards.greenhouse.io/acme/jobs/1");
  });

  it("drop l'offre si toutes les apply options sont non fiables", () => {
    const item = {
      title: "Chef de projet",
      job_apply_link: "https://www.google.com/search?ibp=htl;jobs",
      apply_options: [
        { source: "LinkedIn", url: "https://fr.linkedin.com/jobs/view/1" },
        { source: "Indeed", url: "https://fr.indeed.com/viewjob?jk=1" },
      ],
    };
    expect(pickTrustedApplyUrl(item, CFG)).toBeNull();
    expect(toFtOffer(item, CFG)).toBeNull();
  });

  it("drop l'offre sans aucune URL", () => {
    expect(toFtOffer({ title: "Sans lien" }, CFG)).toBeNull();
  });
});
