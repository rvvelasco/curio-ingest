// sources/hackernews.js — Portada de Hacker News via Algolia. Keyless. Categoria TECNOLOGIA.
import { httpGet } from "../config.js";
import { Category, makePost } from "../schema.js";

export async function fetchHackerNews() {
  const url = "https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=15";
  const data = await httpGet(url, { fixture: "hackernews.json" });

  return (data.hits || [])
    .filter((h) => h.title)
    .map((h) =>
      makePost({
        category: Category.TECNOLOGIA,
        lang: "en",
        title: h.title,
        summary:
          `Tema destacado hoy en la comunidad tech de Hacker News. ` +
          `${h.points || 0} puntos, ${h.num_comments || 0} comentarios.`,
        curiousFact: h.author ? `Compartido por ${h.author}.` : null,
        sourceName: "Hacker News",
        sourceUrl: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
        publishedAt: h.created_at_i ? h.created_at_i * 1000 : null,
      })
    );
}
