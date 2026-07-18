// sources/nasa.js — NASA "Astronomy Picture of the Day". Imágenes reales del espacio.
// DEMO_KEY funciona sin registro (límite bajo, ok para uso personal).
import { httpGet } from "../config.js";
import { Category, makePost } from "../schema.js";

export async function fetchNasaApod() {
  const key = process.env.NASA_API_KEY || "DEMO_KEY";
  const url = `https://api.nasa.gov/planetary/apod?api_key=${key}&count=6`;
  const data = await httpGet(url, { fixture: "nasa.json" });

  return (Array.isArray(data) ? data : [data])
    .filter((a) => a.media_type === "image")
    .map((a) =>
      makePost({
        category: Category.ESPACIO,
        lang: "en",
        title: a.title,
        summary: a.explanation,
        curiousFact: a.copyright ? `Imagen por ${String(a.copyright).trim()}.` : null,
        imageUrl: a.url || a.hdurl || null,
        sourceName: "NASA APOD",
        sourceUrl: `https://apod.nasa.gov/apod/astropix.html`,
        publishedAt: a.date ? Date.parse(a.date) : null,
      })
    );
}
