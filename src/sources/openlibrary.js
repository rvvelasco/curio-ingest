// sources/openlibrary.js — Open Library. Keyless. Portada + SINOPSIS del libro.
import { httpGet, DEMO } from "../config.js";
import { Category, makePost, clean } from "../schema.js";

const SUBJECTS = ["science", "philosophy", "history", "psychology", "technology", "economics"];

export async function fetchOpenLibrary() {
  const subject = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)];
  const url = `https://openlibrary.org/search.json?q=subject:${subject}&limit=10&fields=title,author_name,first_publish_year,cover_i,key`;
  const data = await httpGet(url, { fixture: "openlibrary.json" });

  const books = (data.docs || []).filter((d) => d.cover_i).slice(0, 6);
  const out = [];
  for (const d of books) {
    const author = (d.author_name && d.author_name[0]) || "Autor desconocido";
    const year = d.first_publish_year ? ` (${d.first_publish_year})` : "";
    let synopsis = "";
    if (!DEMO) {
      synopsis = await fetchDescription(d.key);
    }
    const base = `"${d.title}", de ${author}${year}.`;
    out.push(
      makePost({
        category: Category.LIBROS,
        title: d.title,
        summary: synopsis ? shorten(synopsis, 300) : `${base} Tocá para ver de qué trata.`,
        extendedContent: synopsis ? `${base}\n\n${synopsis}` : base,
        curiousFact: `Categoría: ${subject}.`,
        whyItMatters: "Un buen libro puede cambiar cómo pensás sobre un tema entero.",
        imageUrl: `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`,
        sourceName: "Open Library",
        sourceUrl: `https://openlibrary.org${d.key}`,
        lang: "es",
      })
    );
  }
  return out;
}

// La sinopsis vive en el "work": /works/OL...W.json → campo description.
async function fetchDescription(key) {
  try {
    const w = await httpGet(`https://openlibrary.org${key}.json`);
    const desc = w?.description;
    if (!desc) return "";
    return clean(typeof desc === "string" ? desc : desc.value || "", 1500);
  } catch {
    return "";
  }
}

function shorten(t, max) {
  const c = clean(t, 4000);
  return c.length > max ? c.slice(0, max).trimEnd() + "…" : c;
}
