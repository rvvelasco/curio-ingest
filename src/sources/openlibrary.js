// sources/openlibrary.js — Open Library. Keyless. Portada como imagen.
import { httpGet } from "../config.js";
import { Category, makePost } from "../schema.js";

const SUBJECTS = ["science", "philosophy", "history", "psychology", "technology", "economics"];

export async function fetchOpenLibrary() {
  const subject = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)];
  const url = `https://openlibrary.org/search.json?q=subject:${subject}&limit=10&fields=title,author_name,first_publish_year,cover_i,key`;
  const data = await httpGet(url, { fixture: "openlibrary.json" });

  return (data.docs || [])
    .filter((d) => d.cover_i)
    .slice(0, 8)
    .map((d) => {
      const author = (d.author_name && d.author_name[0]) || "Autor desconocido";
      return makePost({
        category: Category.LIBROS,
        title: d.title,
        summary: `"${d.title}", de ${author}` +
          (d.first_publish_year ? `, publicado por primera vez en ${d.first_publish_year}.` : "."),
        curiousFact: `Categoría explorada: ${subject}.`,
        whyItMatters: "Un buen libro puede cambiar cómo pensás sobre un tema entero.",
        imageUrl: `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`,
        sourceName: "Open Library",
        sourceUrl: `https://openlibrary.org${d.key}`,
      });
    });
}
