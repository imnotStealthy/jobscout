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

export const normalize = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
