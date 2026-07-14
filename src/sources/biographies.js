// sources/biographies.js — Nacimientos de un día como hoy. Keyless. Con imagen.
import { httpGet } from "../config.js";
import { Category, makePost } from "../schema.js";

export async function fetchBirthsToday() {
  const now = new Date();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const url = `https://api.wikimedia.org/feed/v1/wikipedia/es/onthisday/births/${mm}/${dd}`;
  const data = await httpGet(url, { fixture: "biographies.json" });

  return (data.births || []).slice(0, 10).map((ev) => {
    const page = (ev.pages && ev.pages[0]) || {};
    return makePost({
      category: Category.BIOGRAFIAS,
      title: page.normalizedtitle || (ev.text || "").split(",")[0],
      summary: page.extract || ev.text,
      curiousFact: `Nació un día como hoy, en ${ev.year}.`,
      imageUrl: page.thumbnail?.source || null,
      sourceName: "Wikipedia",
      sourceUrl: page.content_urls?.desktop?.page ||
        `https://es.wikipedia.org/wiki/${encodeURIComponent(page.normalizedtitle || "")}`,
    });
  });
}
