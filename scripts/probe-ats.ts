// Probe live des endpoints ATS publics (aucun secret). Verdict OK / REJECT.
// Usage: npx tsx scripts/probe-ats.ts
const UA = { "User-Agent": "JobSearcherBot/0.1" };

interface ProbeResult {
  name: string; ats: string; endpoint: string; status: number | string;
  count: number; title?: string; location?: string; url?: string; verdict: "OK" | "REJECT"; reason?: string;
}
const results: ProbeResult[] = [];

function report(r: ProbeResult) {
  results.push(r);
  console.log(`[${r.verdict}] ${r.ats} ${r.name} — HTTP ${r.status}, ${r.count} offres${r.reason ? ` (${r.reason})` : ""}`);
  if (r.verdict === "OK") console.log(`     ex: "${r.title}" | ${r.location} | ${r.url}`);
}

async function probeSmartRecruiters(slug: string) {
  const endpoint = `https://api.smartrecruiters.com/v1/companies/${slug}/postings?country=fr&limit=10`;
  try {
    const res = await fetch(endpoint, { headers: UA });
    if (!res.ok) return report({ name: slug, ats: "SmartRecruiters", endpoint, status: res.status, count: 0, verdict: "REJECT", reason: "HTTP non-200" });
    const d = (await res.json()) as { totalFound?: number; content?: { name?: string; id?: string; company?: { identifier?: string }; location?: { fullLocation?: string; city?: string } }[] };
    const j = d.content?.[0];
    if (!d.totalFound || !j) return report({ name: slug, ats: "SmartRecruiters", endpoint, status: res.status, count: 0, verdict: "REJECT", reason: "0 offre FR" });
    report({
      name: slug, ats: "SmartRecruiters", endpoint, status: res.status, count: d.totalFound,
      title: j.name, location: j.location?.fullLocation ?? j.location?.city,
      url: `https://jobs.smartrecruiters.com/${j.company?.identifier ?? slug}/${j.id}`, verdict: "OK",
    });
  } catch (err) {
    report({ name: slug, ats: "SmartRecruiters", endpoint, status: (err as Error).message, count: 0, verdict: "REJECT", reason: "fetch error" });
  }
}

async function probeLever(slug: string) {
  const endpoint = `https://api.lever.co/v0/postings/${slug}?mode=json`;
  try {
    const res = await fetch(endpoint, { headers: UA });
    if (!res.ok) return report({ name: slug, ats: "Lever", endpoint, status: res.status, count: 0, verdict: "REJECT", reason: "HTTP non-200" });
    const data = (await res.json()) as { text?: string; country?: string; categories?: { location?: string }; hostedUrl?: string }[];
    const fr = data.filter((j) => (j.country ?? "").toUpperCase() === "FR");
    const j = fr[0];
    if (!j) return report({ name: slug, ats: "Lever", endpoint, status: res.status, count: 0, verdict: "REJECT", reason: `0 offre FR (${data.length} total)` });
    report({
      name: slug, ats: "Lever", endpoint, status: res.status, count: fr.length,
      title: j.text, location: j.categories?.location, url: j.hostedUrl, verdict: "OK",
    });
  } catch (err) {
    report({ name: slug, ats: "Lever", endpoint, status: (err as Error).message, count: 0, verdict: "REJECT", reason: "fetch error" });
  }
}

async function probeGreenhouse(slug: string) {
  const endpoint = `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`;
  try {
    const res = await fetch(endpoint, { headers: UA });
    if (!res.ok) return report({ name: slug, ats: "Greenhouse", endpoint, status: res.status, count: 0, verdict: "REJECT", reason: "HTTP non-200" });
    const data = (await res.json()) as { jobs?: { title?: string; absolute_url?: string; location?: { name?: string }; updated_at?: string }[] };
    const jobs = data.jobs ?? [];
    const fr = jobs.filter((j) => /france|paris|lyon|bordeaux|nantes|lille|toulouse|marseille/i.test(j.location?.name ?? ""));
    const j = fr[0] ?? jobs[0];
    if (!jobs.length || !j) return report({ name: slug, ats: "Greenhouse", endpoint, status: res.status, count: 0, verdict: "REJECT", reason: "0 offre" });
    report({
      name: slug, ats: "Greenhouse", endpoint, status: res.status, count: jobs.length,
      title: j.title, location: j.location?.name, url: j.absolute_url,
      verdict: fr.length ? "OK" : "REJECT", reason: fr.length ? `${fr.length} FR` : "aucune offre FR détectée",
    });
  } catch (err) {
    report({ name: slug, ats: "Greenhouse", endpoint, status: (err as Error).message, count: 0, verdict: "REJECT", reason: "fetch error" });
  }
}

async function probeTeamtailor(slug: string) {
  const endpoint = `https://career.${slug}.com/jobs.rss`;
  try {
    const res = await fetch(endpoint, { headers: UA, redirect: "follow" });
    if (!res.ok) return report({ name: slug, ats: "Teamtailor", endpoint, status: res.status, count: 0, verdict: "REJECT", reason: "HTTP non-200" });
    const xml = await res.text();
    if (!xml.includes("<rss") && !xml.includes("<item")) return report({ name: slug, ats: "Teamtailor", endpoint, status: res.status, count: 0, verdict: "REJECT", reason: "pas du RSS" });
    const items = xml.match(/<item>/g)?.length ?? 0;
    const title = xml.match(/<item>[\s\S]*?<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1];
    const link = xml.match(/<item>[\s\S]*?<link>(.*?)<\/link>/)?.[1];
    if (!items) return report({ name: slug, ats: "Teamtailor", endpoint, status: res.status, count: 0, verdict: "REJECT", reason: "0 item" });
    report({ name: slug, ats: "Teamtailor", endpoint, status: res.status, count: items, title, location: "?", url: link, verdict: "OK" });
  } catch (err) {
    report({ name: slug, ats: "Teamtailor", endpoint, status: (err as Error).message, count: 0, verdict: "REJECT", reason: "fetch error" });
  }
}

async function probeWorkday(tenant: string, host: string, board: string) {
  const endpoint = `https://${host}/wday/cxs/${tenant}/${board}/jobs`;
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { ...UA, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ limit: 5, offset: 0, searchText: "France", appliedFacets: {} }),
    });
    if (!res.ok) return report({ name: tenant, ats: "Workday", endpoint, status: res.status, count: 0, verdict: "REJECT", reason: "HTTP non-200" });
    const d = (await res.json()) as { total?: number; jobPostings?: { title?: string; locationsText?: string; externalPath?: string }[] };
    const j = d.jobPostings?.[0];
    if (!d.total || !j) return report({ name: tenant, ats: "Workday", endpoint, status: res.status, count: 0, verdict: "REJECT", reason: "0 offre" });
    report({
      name: tenant, ats: "Workday", endpoint, status: res.status, count: d.total,
      title: j.title, location: j.locationsText, url: `https://${host}${j.externalPath ?? ""}`,
      verdict: "REJECT", reason: "répond mais hors scope cette passe",
    });
  } catch (err) {
    report({ name: tenant, ats: "Workday", endpoint, status: (err as Error).message, count: 0, verdict: "REJECT", reason: "fetch error" });
  }
}

async function probeAshby(slug: string) {
  const endpoint = `https://api.ashbyhq.com/posting-api/job-board/${slug}?includeCompensation=true`;
  try {
    const res = await fetch(endpoint, { headers: UA });
    if (!res.ok) return report({ name: slug, ats: "Ashby", endpoint, status: res.status, count: 0, verdict: "REJECT", reason: "HTTP non-200" });
    const d = (await res.json()) as { jobs?: { id?: string; title?: string; location?: string; secondaryLocations?: { location?: string }[]; jobUrl?: string }[] };
    const jobs = d.jobs ?? [];
    const frRe = /france|paris|lyon|bordeaux|nantes|lille|toulouse|marseille|rennes/i;
    const fr = jobs.filter((j) => frRe.test([j.location, ...(j.secondaryLocations ?? []).map((s) => s.location)].join(" ")));
    const j = fr[0] ?? jobs[0];
    if (!jobs.length || !j) return report({ name: slug, ats: "Ashby", endpoint, status: res.status, count: 0, verdict: "REJECT", reason: "0 offre" });
    report({
      name: slug, ats: "Ashby", endpoint, status: res.status, count: jobs.length,
      title: j.title, location: `${j.location} (${fr.length} FR)`, url: j.jobUrl, verdict: "OK",
    });
  } catch (err) {
    report({ name: slug, ats: "Ashby", endpoint, status: (err as Error).message, count: 0, verdict: "REJECT", reason: "fetch error" });
  }
}

for (const s of ["Ubisoft2", "Wavestone1", "EgisGroup", "VeoliaEnvironnementSA", "GroupementMousquetaires", "Accor", "SGS"]) await probeSmartRecruiters(s);
for (const s of ["ramp", "linear", "plaid", "vercel", "figma"]) await probeAshby(s);
for (const s of ["qonto", "manomano", "heetch", "gorgias", "spendesk", "algolia", "brevo"]) await probeLever(s);
for (const s of ["doctolib", "mirakl", "malt", "dataiku", "blablacar", "backmarket"]) await probeGreenhouse(s);
for (const s of ["deezer", "yousign", "papernest", "leocare", "pennylane"]) await probeTeamtailor(s);
await probeWorkday("michelin", "michelinhr.wd3.myworkdayjobs.com", "Michelin");
await probeWorkday("airbus", "ag.wd3.myworkdayjobs.com", "Airbus");

console.log(`\n=== RÉSUMÉ: ${results.filter((r) => r.verdict === "OK").length} OK / ${results.length} testés ===`);
for (const r of results) console.log(`${r.verdict === "OK" ? "✅" : "❌"} ${r.ats}:${r.name}${r.reason ? ` — ${r.reason}` : ""}`);
