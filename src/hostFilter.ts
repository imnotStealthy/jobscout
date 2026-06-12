export function safeHost(url?: string | null): string | null {
  if (!url) return null;
  try { return new URL(url).hostname.toLowerCase(); } catch { return null; }
}

// excluded ex: ["linkedin.com", "indeed"]
export function isExcludedHost(host: string | null, excluded: string[]): boolean {
  if (!host) return true; // pas d'URL d'origine fiable -> on n'affiche pas
  return excluded.some((raw) => {
    const e = raw.trim().toLowerCase();
    if (!e) return false;
    if (e.includes(".")) return host === e || host.endsWith("." + e); // suffixe domaine
    return host.split(".").includes(e);                               // label marque, tout TLD
  });
}

// Allowlist — même logique suffixe que isExcludedHost : "lever.co" couvre
// "jobs.lever.co" mais pas "evil-lever.co".
export function isTrustedHost(host: string | null, trusted: string[]): boolean {
  if (!host) return false;
  return trusted.some((raw) => {
    const e = raw.trim().toLowerCase();
    if (!e) return false;
    if (e.includes(".")) return host === e || host.endsWith("." + e);
    return host.split(".").includes(e);
  });
}

export const normalize = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
