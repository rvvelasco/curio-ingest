// ============================================================================
// schema.js  —  EL CONTRATO UNICO DE DATOS
// Este mismo esquema se replica en Room (Android). Toda fuente, sin importar
// de que API venga, termina convertida a un objeto "Post" con esta forma.
// ============================================================================

import { createHash } from "node:crypto";

/** Las 20 categorias del feed. El mismo enum existira en Kotlin. */
export const Category = Object.freeze({
  HISTORIA: "HISTORIA",
  GEOGRAFIA: "GEOGRAFIA",
  CULTURA: "CULTURA",
  CIENCIA: "CIENCIA",
  ESPACIO: "ESPACIO",
  TECNOLOGIA: "TECNOLOGIA",
  IA: "IA",
  AVANCES: "AVANCES",
  FILOSOFIA: "FILOSOFIA",
  ESTOICISMO: "ESTOICISMO",
  FINANZAS: "FINANZAS",
  ECONOMIA: "ECONOMIA",
  NEGOCIOS: "NEGOCIOS",
  EMPRENDIMIENTO: "EMPRENDIMIENTO",
  LIBROS: "LIBROS",
  BIOGRAFIAS: "BIOGRAFIAS",
  NOTICIAS_TEC: "NOTICIAS_TEC",
  NOTICIAS_CIEN: "NOTICIAS_CIEN",
  NOTICIAS_ECO: "NOTICIAS_ECO",
  AJEDREZ: "AJEDREZ",
});

/** Metadatos de presentacion por categoria (emoji + color de acento para el fallback visual). */
export const CategoryMeta = Object.freeze({
  HISTORIA:       { emoji: "📚", label: "Historia",            color: "#B08968" },
  GEOGRAFIA:      { emoji: "🌍", label: "Geografía",           color: "#4C8577" },
  CULTURA:        { emoji: "🧠", label: "Cultura General",     color: "#8E7CC3" },
  CIENCIA:        { emoji: "🔬", label: "Ciencia",             color: "#4A7BA6" },
  ESPACIO:        { emoji: "🚀", label: "Espacio",             color: "#3A3A6A" },
  TECNOLOGIA:     { emoji: "💻", label: "Tecnología",          color: "#5B8C85" },
  IA:             { emoji: "🤖", label: "Inteligencia Artificial", color: "#6C7A9C" },
  AVANCES:        { emoji: "⚡", label: "Avances científicos", color: "#C08552" },
  FILOSOFIA:      { emoji: "🏛", label: "Filosofía",           color: "#8A7A6D" },
  ESTOICISMO:     { emoji: "🪨", label: "Estoicismo",          color: "#6E6E6E" },
  FINANZAS:       { emoji: "💰", label: "Finanzas Personales", color: "#4F9D69" },
  ECONOMIA:       { emoji: "📈", label: "Economía",            color: "#3F8E9E" },
  NEGOCIOS:       { emoji: "🏢", label: "Negocios",            color: "#5A7D9A" },
  EMPRENDIMIENTO: { emoji: "👨‍💼", label: "Emprendimiento",   color: "#B5783E" },
  LIBROS:         { emoji: "📖", label: "Libros",              color: "#9C6B4E" },
  BIOGRAFIAS:     { emoji: "👤", label: "Biografías",          color: "#7A6C8A" },
  NOTICIAS_TEC:   { emoji: "📰", label: "Noticias Tecnológicas", color: "#5B8C85" },
  NOTICIAS_CIEN:  { emoji: "📰", label: "Noticias Científicas",  color: "#4A7BA6" },
  NOTICIAS_ECO:   { emoji: "📰", label: "Noticias Económicas",   color: "#3F8E9E" },
  AJEDREZ:        { emoji: "♟", label: "Ajedrez",             color: "#3D3D3D" },
});

/**
 * Crea un Post normalizado. Rellena defaults y calcula el id estable (para dedupe).
 * Campos:
 *  - id            hash estable = sha1(sourceUrl + "|" + title)
 *  - category      una de Category
 *  - subcategory   ej. "Aperturas" dentro de AJEDREZ (opcional)
 *  - title         titulo atractivo (la IA lo puede reescribir)
 *  - summary       2-3 frases claras
 *  - curiousFact   "Dato curioso" (opcional; la IA lo puede generar)
 *  - whyItMatters  "Por que importa" (opcional; la IA lo puede generar)
 *  - imageUrl      null => la app usa fallback (gradiente por categoria)
 *  - sourceName    "Wikipedia", "arXiv", "Lichess"...
 *  - sourceUrl     link real para "Leer fuente original"
 *  - publishedAt   epoch ms de la fuente (si aplica)
 *  - readingSeconds estimacion (~60)
 */
export function makePost(p) {
  const title = (p.title || "").trim();
  const sourceUrl = (p.sourceUrl || "").trim();
  const id = sha1(`${sourceUrl}|${title}`);
  const summary = clean(p.summary);
  return {
    id,
    category: p.category,
    subcategory: p.subcategory || null,
    title,
    summary,
    curiousFact: clean(p.curiousFact) || null,
    whyItMatters: clean(p.whyItMatters) || null,
    imageUrl: p.imageUrl || null,
    sourceName: p.sourceName || "",
    sourceUrl,
    publishedAt: p.publishedAt || null,
    fetchedAt: Date.now(),
    readingSeconds: p.readingSeconds || estimateReadingSeconds(summary),
    extendedContent: p.extendedContent || null,
    aiEnhanced: !!p.aiEnhanced,
  };
}

export function sha1(s) {
  return createHash("sha1").update(s).digest("hex");
}

/** Limpia HTML basico, espacios y recorta. */
export function clean(text, max = 600) {
  if (!text) return "";
  const t = String(text)
    .replace(/<[^>]+>/g, " ")      // quita tags HTML
    .replace(/\s+/g, " ")          // colapsa espacios
    .replace(/\[\d+\]/g, "")       // quita [1] [2] de wiki
    .trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + "…" : t;
}

/** ~200 palabras/min de lectura. */
export function estimateReadingSeconds(text) {
  const words = (text || "").split(/\s+/).filter(Boolean).length;
  return Math.max(20, Math.round((words / 200) * 60));
}
