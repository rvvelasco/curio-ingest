// sources/arxiv.js — arXiv cs.AI. Keyless. Devuelve Atom XML: lo parseamos sin dependencias.
import { httpGet } from "../config.js";
import { Category, makePost, clean } from "../schema.js";

export async function fetchArxivAI() {
  const url =
    "http://export.arxiv.org/api/query?search_query=cat:cs.AI&sortBy=submittedDate&sortOrder=descending&max_results=12";
  const xml = await httpGet(url, { json: false, fixture: "arxiv.xml" });

  const entries = xml.split("<entry>").slice(1); // primer trozo es el header del feed
  return entries.map((raw) => {
    const title = clean(tag(raw, "title"), 200);
    const summary = clean(tag(raw, "summary"), 600);
    const link = (raw.match(/<id>([^<]+)<\/id>/) || [])[1] || "";
    const published = (raw.match(/<published>([^<]+)<\/published>/) || [])[1];
    return makePost({
      category: Category.IA,
        lang: "en",
      title,
      summary,
      sourceName: "arXiv",
      sourceUrl: link.trim(),
      publishedAt: published ? Date.parse(published) : null,
      // imageUrl: null a proposito -> la app usa fallback visual por categoria.
    });
  });
}

function tag(xml, name) {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? m[1] : "";
}
