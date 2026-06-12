import { describe, expect, it } from "vitest";
import { hasSeen, openDb, ProfileRow } from "./db.js";
import type { FtOffer } from "./ftClient.js";
import {
  buildAdzunaQueries, buildCareerjetQueries, buildLbaQueries,
  offerSeenKey, postFilter, postFreshOffers,
} from "./poller.js";

function profile(overrides: Partial<ProfileRow>): ProfileRow {
  return {
    id: 1,
    label: "test",
    discord_channel_id: "1",
    titres: "[]",
    keywords: "[]",
    rome_codes: null,
    appellations: null,
    communes: null,
    departements: null,
    regions: null,
    rayon_km: null,
    teletravail: null,
    type_contrat: null,
    enabled: 1,
    created_at: "now",
    ...overrides,
  };
}

describe("buildLbaQueries", () => {
  it("skips non-alternance profiles", () => {
    expect(buildLbaQueries(profile({ keywords: JSON.stringify(["CDI"]) }))).toEqual([]);
  });

  it("builds department-scoped alternance queries", () => {
    expect(buildLbaQueries(profile({
      keywords: JSON.stringify(["alternance"]),
      rome_codes: JSON.stringify(["M1805"]),
      communes: JSON.stringify(["91000"]),
      regions: JSON.stringify(["IDF"]),
      rayon_km: 25,
    }))).toEqual([{
      romes: "M1805",
      radius: 25,
      departements: ["91", "75", "77", "78", "92", "93", "94", "95"],
    }]);
  });
});

describe("buildAdzunaQueries", () => {
  it("skips alternance profiles", () => {
    expect(buildAdzunaQueries(profile({ keywords: JSON.stringify(["comptable", "alternance"]) }))).toEqual([]);
  });

  it("builds permanent CDI queries", () => {
    expect(buildAdzunaQueries(profile({
      keywords: JSON.stringify(["contrôleur de gestion", "CDI"]),
      departements: JSON.stringify(["91"]),
      rayon_km: 20,
    }))).toEqual([
      {
        what: "contrôleur de gestion CDI",
        where: "Essonne",
        distance: 20,
        permanent: true,
      },
      {
        what: "contrôleur CDI",
        where: "Essonne",
        distance: 20,
        permanent: true,
      },
    ]);
  });
});

describe("postFreshOffers", () => {
  const makeDb = () => {
    const db = openDb(":memory:");
    db.prepare(
      "INSERT INTO profiles (label, discord_channel_id, titres, keywords) VALUES ('t', '1', '[]', '[]')"
    ).run();
    return db;
  };
  const offers: FtOffer[] = [
    { id: "adzuna:1", intitule: "Offre A", entreprise: { nom: "ACME" }, lieuTravail: { libelle: "Paris" } },
    { id: "careerjet:2", intitule: "Offre B", entreprise: { nom: "Beta" }, lieuTravail: { libelle: "Lyon" } },
  ];

  it("notifie uniquement la première offre et marque les deux clés vues", async () => {
    const db = makeDb();
    const notifies: boolean[] = [];
    const posted = await postFreshOffers(db, { id: 1 } as ProfileRow, offers,
      async (_p, _o, notify) => { notifies.push(notify); });
    expect(posted).toBe(2);
    expect(notifies).toEqual([true, false]);
    for (const o of offers) {
      expect(hasSeen(db, 1, offerSeenKey(o))).toBe(true);
      expect(hasSeen(db, 1, o.id)).toBe(true);
    }
  });

  it("un second run ne reposte pas les offres déjà vues", async () => {
    const db = makeDb();
    await postFreshOffers(db, { id: 1 } as ProfileRow, offers, async () => {});
    // même filtre que runProfile en sortie de pipeline
    const fresh = offers.filter((o) => !hasSeen(db, 1, offerSeenKey(o)) && !hasSeen(db, 1, o.id));
    expect(fresh).toEqual([]);
  });

  it("ne marque pas vue une offre dont le post a échoué", async () => {
    const db = makeDb();
    const posted = await postFreshOffers(db, { id: 1 } as ProfileRow, offers,
      async (_p, o) => { if (o.id === "adzuna:1") throw new Error("send failed"); });
    expect(posted).toBe(1);
    expect(hasSeen(db, 1, "adzuna:1")).toBe(false);
    expect(hasSeen(db, 1, "careerjet:2")).toBe(true);
  });
});

describe("postFilter — match titre via description (toutes sources)", () => {
  const EXCLUDED = ["linkedin.com", "indeed"];
  const p = profile({ titres: JSON.stringify(["Qualité système"]) });
  const offer = (overrides: Partial<FtOffer>): FtOffer => ({
    id: "1",
    intitule: "Offre",
    origineOffre: { urlOrigine: "https://careers.example.com/job/1" },
    ...overrides,
  });

  it("garde une offre FT dont le titre matche", () => {
    expect(postFilter([offer({ intitule: "Responsable Qualité Système H/F" })], p, EXCLUDED)).toHaveLength(1);
  });

  it("garde une offre Careerjet quand le titre n'est que dans la description", () => {
    expect(postFilter([offer({
      id: "careerjet:abc",
      intitule: "Chargé Assurance Qualité (F/H)",
      description: "Vous pilotez la qualité système et les audits fournisseurs.",
    })], p, EXCLUDED)).toHaveLength(1);
  });

  it("garde une offre FT quand le titre n'est que dans la description", () => {
    expect(postFilter([offer({
      intitule: "Responsable Qualité et Processus IT (H/F)",
      description: "Garant du système de management de la qualité (SMQ).",
    })], p, EXCLUDED)).toHaveLength(1);
  });

  it("rejette si ni titre ni description ne matchent", () => {
    expect(postFilter([offer({
      intitule: "Second de cuisine H/F",
      description: "Service du midi, brigade de 5 personnes.",
    })], p, EXCLUDED)).toHaveLength(0);
  });

  it("rejette toujours les hosts exclus même si le titre matche", () => {
    expect(postFilter([offer({
      intitule: "Qualité système H/F",
      origineOffre: { urlOrigine: "https://fr.linkedin.com/jobs/1" },
    })], p, EXCLUDED)).toHaveLength(0);
  });
});

describe("buildCareerjetQueries", () => {
  it("skips alternance profiles", () => {
    expect(buildCareerjetQueries(profile({ keywords: JSON.stringify(["comptable", "alternance"]) }))).toEqual([]);
  });

  it("builds CDI queries with Careerjet contract code", () => {
    expect(buildCareerjetQueries(profile({
      keywords: JSON.stringify(["qualite systeme", "CDI"]),
      regions: JSON.stringify(["IDF"]),
      rayon_km: 50,
    }))).toEqual([
      {
        keywords: "qualite systeme CDI",
        location: "Ile-de-France",
        radius: 50,
        contractType: "p",
      },
      {
        keywords: "qualite CDI",
        location: "Ile-de-France",
        radius: 50,
        contractType: "p",
      },
    ]);
  });
});
