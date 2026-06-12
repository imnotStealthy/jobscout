// Vérification technique des endpoints ATS publics (aucun secret requis).
// Usage: npx tsx scripts/probe-ats.ts
const UA = { "User-Agent": "JobSearcherBot/0.1" };

async function probe(name: string, url: string) {
  try {
    const res = await fetch(url, { headers: UA });
    const status = res.status;
    if (!res.ok) { console.log(`${name}: HTTP ${status} -> KO`); return; }
    const data = (await res.json()) as Record<string, unknown>;
    console.log(`\n=== ${name}: HTTP ${status} ===`);
    if (Array.isArray(data)) {
      console.log(`array racine, ${data.length} items; sample keys:`, Object.keys((data[0] ?? {}) as object).join(","));
      console.log("sample:", JSON.stringify(data[0], null, 1)?.slice(0, 900));
    } else {
      console.log("keys racine:", Object.keys(data).join(","));
      const arr = (data.content ?? data.jobs ?? data.offers) as unknown[] | undefined;
      console.log(`total annoncé: ${data.totalFound ?? data.meta ?? (arr?.length ?? "?")}, items: ${arr?.length ?? 0}`);
      if (arr?.[0]) console.log("sample:", JSON.stringify(arr[0], null, 1)?.slice(0, 900));
    }
  } catch (err) {
    console.log(`${name}: ERREUR ${(err as Error).message}`);
  }
}

// Slugs vérifiés 2026-06-12 : Ubisoft2/Wavestone1 OK (200 + offres), qonto OK.
// Rejetés : Ubisoft/Decathlon*/Wavestone/SopraSteria* (200 mais 0 offre),
// Greenhouse blablacar/backmarket/swile/payfit (404).
await probe("SmartRecruiters Ubisoft2", "https://api.smartrecruiters.com/v1/companies/Ubisoft2/postings?limit=10&country=fr");
await probe("SmartRecruiters Wavestone1", "https://api.smartrecruiters.com/v1/companies/Wavestone1/postings?limit=10&country=fr");
await probe("Lever qonto", "https://api.lever.co/v0/postings/qonto?mode=json");
