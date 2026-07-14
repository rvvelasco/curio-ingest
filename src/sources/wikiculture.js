// sources/wikiculture.js — Artículos más leídos de Wikipedia hoy. Keyless. Con imagen.
import { httpGet } from "../config.js";
import { Category, makePost } from "../schema.js";

export async function fetchWikiFeatured() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const url = `https://api.wikimedia.org/feed/v1/wikipedia/es/featured/${y}/${mm}/${dd}`;
  const data = await httpGet(url, { fixture: "wikiculture.json" });

  const articles = (data.mostread?.articles || []).slice(0, 10);
  return articles
    .filter((a) => a.extract && a.normalizedtitle)
    .map((a) =>
      makePost({
        category: Category.CULTURA,
        title: a.normalizedtitle,
        summary: a.extract,
        curiousFact: "Uno de los artículos más leídos hoy en Wikipedia.",
        imageUrl: a.thumbnail?.source || null,
        sourceName: "Wikipedia",
        sourceUrl: a.content_urls?.desktop?.page ||
          `https://es.wikipedia.org/wiki/${encodeURIComponent(a.normalizedtitle)}`,
      })
    );
}
