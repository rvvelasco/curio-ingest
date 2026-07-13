// ============================================================================
// store.js  —  dedupe + ventana deslizante + escritura de JSON estatico
// ============================================================================

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Category, CategoryMeta } from "./schema.js";
import { MAX_PER_CATEGORY } from "./config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "docs");

/** Dedupe por id (conserva la primera aparición). */
export function dedupe(posts) {
  const seen = new Set();
  const out = [];
  for (const p of posts) {
    if (!p.id || seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
  }
  return out;
}

/** Ordena por fecha (publishedAt o fetchedAt) descendente. */
function byRecency(a, b) {
  return (b.publishedAt || b.fetchedAt) - (a.publishedAt || a.fetchedAt);
}

/**
 * Fusiona los posts nuevos con lo ya publicado (para no perder historial),
 * deduplica, ordena y recorta a MAX_PER_CATEGORY por categoría.
 */
export async function mergeAndWrite(newPosts) {
  await mkdir(OUT_DIR, { recursive: true });

  // Cargar lo previo (si existe) para mantener ventana rodante.
  let previous = [];
  const allPath = join(OUT_DIR, "feed_all.json");
  if (existsSync(allPath)) {
    try {
      previous = JSON.parse(await readFile(allPath, "utf8")).posts || [];
    } catch { /* ignore */ }
  }

  const merged = dedupe([...newPosts, ...previous]);

  // Agrupar por categoría y recortar.
  const byCat = {};
  for (const cat of Object.keys(Category)) byCat[cat] = [];
  for (const p of merged) (byCat[p.category] ||= []).push(p);

  const finalAll = [];
  const catIndex = [];
  for (const cat of Object.keys(byCat)) {
    const list = byCat[cat].sort(byRecency).slice(0, MAX_PER_CATEGORY);
    if (list.length === 0) continue;
    finalAll.push(...list);
    catIndex.push({ category: cat, ...CategoryMeta[cat], count: list.length });
    // Un archivo por categoría (la app puede pedir solo el que necesita).
    await writeJson(join(OUT_DIR, `feed_${cat}.json`), {
      category: cat,
      ...CategoryMeta[cat],
      updatedAt: Date.now(),
      posts: list,
    });
  }

  finalAll.sort(byRecency);

  // feed_all.json (feed "Todo") + index.json (metadatos de categorías).
  await writeJson(allPath, { updatedAt: Date.now(), count: finalAll.length, posts: finalAll });
  await writeJson(join(OUT_DIR, "index.json"), {
    updatedAt: Date.now(),
    categories: catIndex.sort((a, b) => a.label.localeCompare(b.label)),
    total: finalAll.length,
  });

  return { total: finalAll.length, categories: catIndex.length };
}

async function writeJson(path, obj) {
  await writeFile(path, JSON.stringify(obj, null, 2), "utf8");
}
