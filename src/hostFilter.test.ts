import { describe, expect, it } from "vitest";
import { isExcludedHost, normalize, safeHost } from "./hostFilter.js";

const EXCLUDED = ["linkedin.com", "indeed"];

describe("safeHost", () => {
  it("extracts host lowercase", () => {
    expect(safeHost("https://Careers.Example.COM/job/1")).toBe("careers.example.com");
  });
  it("returns null on missing/invalid url", () => {
    expect(safeHost(null)).toBeNull();
    expect(safeHost(undefined)).toBeNull();
    expect(safeHost("not a url")).toBeNull();
  });
});

describe("isExcludedHost", () => {
  it("drops null host", () => {
    expect(isExcludedHost(null, EXCLUDED)).toBe(true);
  });
  it("drops linkedin domain + subdomains", () => {
    expect(isExcludedHost("linkedin.com", EXCLUDED)).toBe(true);
    expect(isExcludedHost("fr.linkedin.com", EXCLUDED)).toBe(true);
  });
  it("drops indeed all TLDs", () => {
    expect(isExcludedHost("indeed.com", EXCLUDED)).toBe(true);
    expect(isExcludedHost("fr.indeed.fr", EXCLUDED)).toBe(true);
  });
  it("keeps legit career sites", () => {
    expect(isExcludedHost("careers.example.com", EXCLUDED)).toBe(false);
    expect(isExcludedHost("notlinkedin.com.example.org", EXCLUDED)).toBe(false);
  });
});

describe("normalize", () => {
  it("strips accents and case", () => {
    expect(normalize("Chargé de Mission")).toBe("charge de mission");
    expect(normalize("  PMO / Transfo  ")).toBe("pmo / transfo");
  });
});
