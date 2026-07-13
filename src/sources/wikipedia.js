// sources/wikipedia.js — "On this day" (Efemérides). Keyless. Trae imagen y extracto.
import { httpGet } from "../config.js";
import { Category, makePost } from "../schema.js";

export async function fetchWikipediaOnThisDay() {
  const now = new Date();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const url = `https://api.wikimedia.org/feed/v1/wikipedia/es/onthisday/events/${mm}/${dd}`;
  const data = await httpGet(url, { fixture: "wikipedia.json" });

  const events = (data.events || []).slice(0, 12);
  return events.map((ev) => {
    const page = (ev.pages && ev.pages[0]) || {};
    return makePost({
      category: Category.HISTORIA,
      title: `${ev.year}: ${page.normalizedtitle || firstWords(ev.text)}`,
      summary: page.extract || ev.text,
      curiousFact: `Ocurrió un día como hoy, en el año ${ev.year}.`,
      imageUrl: page.thumbnail?.source || null,
      sourceName: "Wikipedia",
      sourceUrl:
        page.content_urls?.desktop?.page ||
        `https://es.wikipedia.org/wiki/${encodeURIComponent(page.normalizedtitle || "")}`,
      publishedAt: null,
    });
  });
}

function firstWords(t, n = 8) {
  return (t || "").split(/\s+/).slice(0, n).join(" ");
}
