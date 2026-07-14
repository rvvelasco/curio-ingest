// sources/gdeltnews.js — Noticias reales vía GDELT. Keyless. A veces trae imagen (socialimage).
import { httpGet, DEMO } from "../config.js";
import { makePost } from "../schema.js";

export async function gdeltNews(category, query, { max = 8 } = {}) {
  if (DEMO) {
    return [
      makePost({
        category,
        title: `(demo) Titular de ${query}`,
        summary: `(demo) Noticia reciente sobre ${query}. En la corrida real llega el titular verdadero.`,
        sourceName: "Medio de noticias",
        sourceUrl: "https://example.com",
        publishedAt: Date.now(),
      }),
    ];
  }

  const q = encodeURIComponent(`${query} sourcelang:spanish`);
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${q}&mode=artlist&maxrecords=${max}&format=json&sort=datedesc`;
  const data = await httpGet(url);

  return (data.articles || [])
    .filter((a) => a.title && a.url)
    .map((a) =>
      makePost({
        category,
        title: a.title,
        summary: `Noticia reciente publicada por ${a.domain || "un medio"}.`,
        imageUrl: a.socialimage || null,
        sourceName: a.domain || "Noticias",
        sourceUrl: a.url,
        publishedAt: parseGdeltDate(a.seendate),
      })
    );
}

// GDELT usa fechas tipo "20260713T120000Z".
function parseGdeltDate(s) {
  if (!s || s.length < 15) return null;
  const iso = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(9, 11)}:${s.slice(11, 13)}:${s.slice(13, 15)}Z`;
  const t = Date.parse(iso);
  return isNaN(t) ? null : t;
}
