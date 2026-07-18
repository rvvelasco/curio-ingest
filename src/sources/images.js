// sources/images.js — Garantiza una imagen para cada post.
//  1) usa la imagen de la fuente si ya tiene,
//  2) si no, busca una foto temática en Wikimedia Commons (keyless),
//  3) si falla, usa una foto de respaldo determinística (Picsum). Nunca queda sin imagen.
import { httpGet, DEMO } from "../config.js";
import { sha1 } from "../schema.js";

export async function ensureImage(post) {
  if (post.imageUrl && post.imageUrl.trim()) return post;

  // Respaldo determinístico (misma card => misma foto).
  const seed = sha1(post.id).slice(0, 12);
  const picsum = `https://picsum.photos/seed/${seed}/800/450`;

  if (DEMO) return { ...post, imageUrl: picsum };

  // Intento temático en Wikimedia Commons.
  try {
    const q = encodeURIComponent(post.title.split(":")[0].slice(0, 60));
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${q}` +
      `&gsrnamespace=6&gsrlimit=1&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json&origin=*`;
    const data = await httpGet(url);
    const pages = data?.query?.pages;
    if (pages) {
      const first = Object.values(pages)[0];
      const thumb = first?.imageinfo?.[0]?.thumburl || first?.imageinfo?.[0]?.url;
      if (thumb) return { ...post, imageUrl: thumb };
    }
  } catch {
    // seguimos al respaldo
  }
  return { ...post, imageUrl: picsum };
}
