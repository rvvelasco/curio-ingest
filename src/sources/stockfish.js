// sources/stockfish.js — Novedades de Stockfish via GitHub Releases API. Keyless.
// Categoria AJEDREZ / subcat "Novedades de Stockfish".
import { httpGet } from "../config.js";
import { Category, makePost, clean } from "../schema.js";

export async function fetchStockfishReleases() {
  const url = "https://api.github.com/repos/official-stockfish/Stockfish/releases?per_page=4";
  const data = await httpGet(url, { fixture: "stockfish.json" });

  return (data || []).map((r) =>
    makePost({
      category: Category.AJEDREZ,
      lang: "en",
      subcategory: "Novedades de Stockfish",
      title: `Stockfish ${r.name || r.tag_name}`,
      summary:
        clean(r.body, 500) ||
        `Nueva versión del motor de ajedrez más fuerte del mundo: ${r.tag_name}.`,
      curiousFact: "Stockfish es de código abierto y supera con holgura a cualquier humano.",
      whyItMatters:
        "Cada versión suele traer mejoras de fuerza de juego que influyen en el análisis de todo el mundo del ajedrez.",
      sourceName: "GitHub · Stockfish",
      sourceUrl: r.html_url,
      publishedAt: r.published_at ? Date.parse(r.published_at) : null,
    })
  );
}
