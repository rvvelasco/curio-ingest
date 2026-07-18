// sources/spaceflight.js — Spaceflight News API v4. Keyless. Ya trae resumen + imagen.
import { httpGet } from "../config.js";
import { Category, makePost } from "../schema.js";

export async function fetchSpaceflight() {
  const url = "https://api.spaceflightnewsapi.net/v4/articles/?limit=12&ordering=-published_at";
  const data = await httpGet(url, { fixture: "spaceflight.json" });

  return (data.results || []).map((a) =>
    makePost({
      category: Category.ESPACIO,
        lang: "en",
      title: a.title,
      summary: a.summary,
      imageUrl: a.image_url || null,
      sourceName: a.news_site || "Spaceflight News",
      sourceUrl: a.url,
      publishedAt: a.published_at ? Date.parse(a.published_at) : null,
    })
  );
}
