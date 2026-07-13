// ============================================================================
// config.js  —  configuracion + helper HTTP (con modo demo offline)
// ============================================================================

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** --demo lee fixtures locales en vez de llamar a la red (para probar sin internet). */
export const DEMO = process.argv.includes("--demo");

/** Cuantos items conservar por categoria (ventana deslizante). */
export const MAX_PER_CATEGORY = 60;

/** User-agent cortes: Wikipedia/arXiv piden identificarse. Poné tu contacto real. */
export const USER_AGENT =
  "CurioApp/0.1 (personal learning app; contacto: tu-email@ejemplo.com)";

/** fetch con timeout, user-agent y soporte de modo demo (fixtures). */
export async function httpGet(url, { json = true, fixture = null } = {}) {
  if (DEMO && fixture) {
    const raw = await readFile(join(__dirname, "fixtures", fixture), "utf8");
    return json ? JSON.parse(raw) : raw;
  }
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: json ? "application/json" : "*/*" },
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
    return json ? res.json() : res.text();
  } finally {
    clearTimeout(t);
  }
}
