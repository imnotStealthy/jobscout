import { describe, expect, it } from "vitest";
import type { ProfileRow } from "./db.js";
import { detectContractLabel } from "./atsContract.js";
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
  });
});
