import { describe, expect, it } from "vitest";
import type { ProfileRow } from "./db.js";
import { detectContractLabel } from "./atsContract.js";
import { ashbyToFtOffer, isFranceAshby } from "./ashbyClient.js";
import { ghToFtOffer, isFranceLocation } from "./greenhouseClient.js";
import { srToFtOffer } from "./smartrecruitersClient.js";
import { leverToFtOffer } from "./leverClient.js";
import { offerSeenKey, postFilter } from "./poller.js";

const EXCLUDED = ["linkedin.com", "indeed"];
const profile = (overrides: Partial<ProfileRow>): ProfileRow => ({
  id: 1, label: "t", discord_channel_id: "1", titres: "[]", keywords: "[]",
  rome_codes: null, appellations: null, communes: null, departements: null,
  regions: null, rayon_km: null, teletravail: null, type_contrat: null,
  enabled: 1, created_at: "now", ...overrides,
});

describe("detectContractLabel", () => {
  it("détecte alternance/apprenticeship avant full-time", () => {
    expect(detectContractLabel("Alternance - Collaborateur Comptable Full-time")).toBe("Alternance");
    expect(detectContractLabel("Data Analyst Apprenticeship")).toBe("Alternance");
    expect(detectContractLabel("apprenti boulanger")).toBe("Alternance");
  });
  it("détecte stage/internship", () => {
    expect(detectContractLabel("STAGE - Assistant Chef de Projet")).toBe("Stage");
    expect(detectContractLabel("Software Engineer Intern")).toBe("Stage");
  });
  it("détecte CDI/permanent/full-time en dernier recours", () => {
    expect(detectContractLabel("Consultant Junior - CDI")).toBe("CDI");
    expect(detectContractLabel("permanent Full-time")).toBe("CDI");
  });
  it("détecte CDD et VIE", () => {
    expect(detectContractLabel("Chargé de mission CDD 12 mois")).toBe("CDD");
    expect(detectContractLabel("fixed-term contract")).toBe("CDD");
    expect(detectContractLabel("VIE - Business Developer Munich")).toBe("VIE");
  });
  it("ne force pas un contrat non identifiable", () => {
    expect(detectContractLabel("Backend Tech Lead - Python/Go")).toBeNull();
  });
});

describe("srToFtOffer", () => {
  const posting = {
    id: "744000131737941",
    uuid: "01569d1a-d29f",
    name: "Consultant·e Junior - CDI",
    releasedDate: "2026-06-11T18:22:39.059Z",
    company: { identifier: "Wavestone1", name: "Wavestone" },
    location: { city: "Paris", country: "fr", fullLocation: "Paris, Île-de-France, France" },
    typeOfEmployment: { id: "permanent", label: "Full-time" },
  };
  it("mappe vers FtOffer avec URL ATS officielle et id stable", () => {
    const o = srToFtOffer(posting, "Wavestone1");
    expect(o.id).toBe("smartrecruiters:01569d1a-d29f");
    expect(o.origineOffre?.urlOrigine).toBe("https://jobs.smartrecruiters.com/Wavestone1/744000131737941");
    expect(o.entreprise?.nom).toBe("Wavestone");
    expect(o.typeContratLibelle).toContain("CDI");
    expect(o.dateCreation).toBe("2026-06-11T18:22:39.059Z");
  });
  it("id stable -> dédup identique entre deux polls", () => {
    expect(offerSeenKey(srToFtOffer(posting, "Wavestone1")))
      .toBe(offerSeenKey(srToFtOffer({ ...posting }, "Wavestone1")));
  });
});

describe("leverToFtOffer", () => {
  const posting = {
    id: "3856d52f",
    text: "Alternance - Collaborateur Comptable",
    createdAt: 1613147522541,
    country: "FR",
    categories: { commitment: "Full-time", location: "Paris" },
    hostedUrl: "https://jobs.lever.co/qonto/3856d52f",
  };
  it("mappe vers FtOffer avec hostedUrl et contrat détecté", () => {
    const o = leverToFtOffer(posting, "qonto");
    expect(o?.id).toBe("lever:3856d52f");
    expect(o?.origineOffre?.urlOrigine).toBe("https://jobs.lever.co/qonto/3856d52f");
    expect(o?.typeContratLibelle).toContain("Alternance");
  });
  it("drop une offre sans hostedUrl (URL d'origine obligatoire)", () => {
    expect(leverToFtOffer({ id: "x", text: "Offre" }, "qonto")).toBeNull();
  });
});

describe("ghToFtOffer", () => {
  const job = {
    id: 6548126003,
    title: "Stage - Account Executive (x/f/m)",
    absolute_url: "https://job-boards.greenhouse.io/doctolib/jobs/6548126003",
    updated_at: "2026-06-10T08:00:00-04:00",
    location: { name: "Paris, France" },
    content: "&lt;p&gt;Mission : pilotage de la qualité système.&lt;/p&gt;",
  };
  it("mappe vers FtOffer avec absolute_url et contrat détecté", () => {
    const o = ghToFtOffer(job, "doctolib");
    expect(o?.id).toBe("greenhouse:6548126003");
    expect(o?.origineOffre?.urlOrigine).toBe("https://job-boards.greenhouse.io/doctolib/jobs/6548126003");
    expect(o?.typeContratLibelle).toBe("Stage");
    expect(o?.description).toBe("Mission : pilotage de la qualité système.");
  });
  it("drop une offre sans absolute_url (URL obligatoire)", () => {
    expect(ghToFtOffer({ id: 1, title: "Offre" }, "doctolib")).toBeNull();
  });
  it("id stable -> dédup identique entre deux fetches", () => {
    expect(offerSeenKey(ghToFtOffer(job, "doctolib")!))
      .toBe(offerSeenKey(ghToFtOffer({ ...job }, "doctolib")!));
  });
  it("filtre France sur location.name", () => {
    expect(isFranceLocation("Paris, France")).toBe(true);
    expect(isFranceLocation("London, England, United Kingdom")).toBe(false);
    expect(isFranceLocation(undefined)).toBe(false);
  });
});

describe("ashbyToFtOffer", () => {
  const job = {
    id: "ba4a5f3e-aea0-422e",
    title: "Software Engineer Intern",
    employmentType: "Intern",
    location: "Paris, France",
    secondaryLocations: [{ location: "Remote (Europe)" }],
    publishedAt: "2026-06-10T08:00:00Z",
    jobUrl: "https://jobs.ashbyhq.com/plaid/ba4a5f3e-aea0-422e",
    applyUrl: "https://jobs.ashbyhq.com/plaid/ba4a5f3e-aea0-422e/application",
  };
  it("mappe vers FtOffer avec jobUrl officielle et contrat détecté", () => {
    const o = ashbyToFtOffer(job, "plaid");
    expect(o?.id).toBe("ashby:ba4a5f3e-aea0-422e");
    expect(o?.origineOffre?.urlOrigine).toBe("https://jobs.ashbyhq.com/plaid/ba4a5f3e-aea0-422e");
    expect(o?.typeContratLibelle).toBe("Stage (Intern)");
    expect(o?.lieuTravail?.libelle).toBe("Paris, France, Remote (Europe)");
    expect(o?.dateCreation).toBe("2026-06-10T08:00:00Z");
  });
  it("retombe sur applyUrl si jobUrl absente, drop si aucune URL", () => {
    expect(ashbyToFtOffer({ id: "x", title: "Offre", applyUrl: "https://jobs.ashbyhq.com/x/1" }, "plaid")?.origineOffre?.urlOrigine)
      .toBe("https://jobs.ashbyhq.com/x/1");
    expect(ashbyToFtOffer({ id: "y", title: "Offre" }, "plaid")).toBeNull();
  });
  it("id stable -> dédup identique entre deux fetches", () => {
    expect(offerSeenKey(ashbyToFtOffer(job, "plaid")!))
      .toBe(offerSeenKey(ashbyToFtOffer({ ...job }, "plaid")!));
  });
  it("filtre France sur location ou secondaryLocations", () => {
    expect(isFranceAshby({ id: "1", location: "Paris" })).toBe(true);
    expect(isFranceAshby({ id: "2", location: "New York, NY (HQ)" })).toBe(false);
    expect(isFranceAshby({ id: "3", location: "Remote", secondaryLocations: [{ location: "Lyon" }] })).toBe(true);
    expect(isFranceAshby({ id: "4", location: "London" })).toBe(false);
  });
});

describe("postFilter sur offres ATS", () => {
  it("profil alternance garde l'offre Lever Apprenticeship, drop la CDI", () => {
    const p = profile({ keywords: JSON.stringify(["comptable", "alternance"]) });
    const alternance = leverToFtOffer({
      id: "a", text: "Alternance - Collaborateur Comptable",
      categories: { commitment: "Apprenticeship" }, hostedUrl: "https://jobs.lever.co/qonto/a",
    }, "qonto")!;
    const cdi = srToFtOffer({
      id: "b", uuid: "b", name: "Consultant Junior - CDI",
      company: { identifier: "Wavestone1" }, typeOfEmployment: { id: "permanent", label: "Full-time" },
    }, "Wavestone1");
    expect(postFilter([alternance, cdi], p, EXCLUDED).map((o) => o.id)).toEqual(["lever:a"]);
  });

  it("exclut toujours LinkedIn/Indeed même via une offre ATS trafiquée", () => {
    const p = profile({});
    const offer = leverToFtOffer({
      id: "c", text: "Offre", hostedUrl: "https://fr.linkedin.com/jobs/1",
    }, "qonto")!;
    expect(postFilter([offer], p, EXCLUDED)).toHaveLength(0);
    const gh = ghToFtOffer({
      id: "d", title: "Offre", absolute_url: "https://fr.indeed.com/viewjob?jk=1",
    }, "doctolib")!;
    expect(postFilter([gh], p, EXCLUDED)).toHaveLength(0);
    const ashby = ashbyToFtOffer({
      id: "e", title: "Offre", jobUrl: "https://glassdoor.com/job/1",
    }, "plaid")!;
    expect(postFilter([ashby], p, ["linkedin.com", "indeed", "glassdoor"])).toHaveLength(0);
  });
});
