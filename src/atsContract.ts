import { normalize } from "./hostFilter.js";

// Détection de contrat depuis titre + champ contrat ATS (EN/FR).
// Ordre important : alternance/stage/vie/cdd avant cdi ("Full-time" est ambigu,
// un "Alternance - X" Lever est aussi commitment Full-time). Retourne null si
// rien d'identifiable — on ne force jamais un contrat.
export function detectContractLabel(text: string): "Alternance" | "Stage" | "VIE" | "CDD" | "CDI" | null {
  const t = normalize(text);
  if (/\b(alternance|apprenticeship|apprentissage|apprenti|apprentie)\b/.test(t)) return "Alternance";
  if (/\b(stage|internship|intern|stagiaire)\b/.test(t)) return "Stage";
  if (/\bvie\b|volontariat international/.test(t)) return "VIE";
  if (/\bcdd\b|fixed[ -]term|temporary/.test(t)) return "CDD";
  if (/\bcdi\b|\bpermanent\b|full[ -]time/.test(t)) return "CDI";
  return null;
}

// Libellé contrat enrichi pour postFilter (qui matche sur le texte normalisé) :
// conserve le label brut ATS et ajoute le contrat détecté s'il diffère.
export function contractLibelle(rawLabel: string | undefined, detected: string | null): string | undefined {
  if (!rawLabel) return detected ?? undefined;
  if (!detected || normalize(rawLabel).includes(normalize(detected))) return rawLabel;
  return `${detected} (${rawLabel})`;
}
