// sources/wikitopics.js — Adaptador REUTILIZABLE de temas de Wikipedia.
// Trae resumen corto (para la card) + texto largo (extendedContent, para "Leer más") + imagen.
// Rota los temas en cada corrida (variedad sin algoritmo).
import { httpGet, DEMO } from "../config.js";
import { makePost, clean } from "../schema.js";

export const SEEDS = {
  HISTORIA: ["Imperio romano", "Antiguo Egipto", "Segunda Guerra Mundial", "Revolución francesa",
    "Imperio inca", "Edad Media", "Renacimiento", "Guerra Fría", "Antigua Grecia",
    "Revolución industrial", "Imperio bizantino", "Primera Guerra Mundial", "Civilización maya",
    "Imperio azteca", "Antigua Roma", "Cristóbal Colón"],
  BIOGRAFIAS: ["Leonardo da Vinci", "Marie Curie", "Albert Einstein", "Nikola Tesla",
    "Napoleón Bonaparte", "Cleopatra", "Charles Darwin", "Frida Kahlo", "Isaac Newton",
    "Mahatma Gandhi", "Alan Turing", "Ada Lovelace", "Simón Bolívar", "Galileo Galilei",
    "William Shakespeare", "Vincent van Gogh"],
  FILOSOFIA: ["Sócrates", "Platón", "Aristóteles", "Immanuel Kant", "Friedrich Nietzsche",
    "René Descartes", "Ética", "Existencialismo", "Empirismo", "Metafísica", "Lógica",
    "David Hume", "John Locke", "Baruch Spinoza", "Ludwig Wittgenstein"],
  ESTOICISMO: ["Estoicismo", "Marco Aurelio", "Séneca", "Epicteto", "Zenón de Citio",
    "Crisipo de Solos", "Catón el Joven", "Filosofía helenística"],
  CIENCIA: ["Teoría de la relatividad", "Mecánica cuántica", "Evolución", "ADN",
    "Fotosíntesis", "Tabla periódica", "Big Bang", "Sistema inmunitario", "Termodinámica",
    "Genética", "Neurona", "Agujero negro", "Antibiótico", "Placa tectónica"],
  AVANCES: ["CRISPR", "Inteligencia artificial", "Vacuna de ARN mensajero", "Computación cuántica",
    "Energía de fusión", "Telescopio espacial James Webb", "Onda gravitacional", "Célula madre",
    "Impresión 3D", "Vehículo autónomo"],
  ECONOMIA: ["Inflación", "Producto interno bruto", "Oferta y demanda", "Interés compuesto",
    "Política monetaria", "Comercio internacional", "Recesión", "Banco central",
    "Microeconomía", "Macroeconomía"],
  FINANZAS: ["Interés compuesto", "Presupuesto", "Inversión", "Fondo indexado", "Ahorro",
    "Bolsa de valores", "Acción (finanzas)", "Bono (finanzas)", "Diversificación (finanzas)"],
  NEGOCIOS: ["Modelo de negocio", "Marketing", "Cadena de suministro", "Economía de escala",
    "Franquicia", "Marca", "Estrategia empresarial", "Publicidad"],
  EMPRENDIMIENTO: ["Emprendimiento", "Empresa emergente", "Capital riesgo", "Steve Jobs",
    "Elon Musk", "Modelo de negocio", "Jeff Bezos", "Innovación"],
};

/** Preview por FRASES completas (nunca corta a mitad de idea). */
function shortSummary(text, maxChars = 480) {
  const t = clean(text, 4000);
  if (t.length <= maxChars) return t;
  const sentences = t.match(/[^.!?]+[.!?]+/g) || [t];
  let out = "";
  for (const s of sentences) {
    if (out.length > 0 && (out + s).length > maxChars) break;
    out += s;
    if (out.length >= maxChars) break;
  }
  return (out.trim() || t.slice(0, maxChars).trim() + "…");
}

export async function wikiTopics(category, titles, { count = 5, subcategory = null } = {}) {
  if (DEMO) {
    return titles.slice(0, 2).map((t) =>
      makePost({
        category, subcategory,
        title: t,
        summary: `(demo) Resumen corto de "${t}".`,
        extendedContent: `(demo) Texto largo de "${t}" para el botón Leer más. En la corrida real, Wikipedia trae varios párrafos.`,
        sourceName: "Wikipedia",
        sourceUrl: `https://es.wikipedia.org/wiki/${encodeURIComponent(t)}`,
        lang: "es",
      })
    );
  }

  const chosen = [...titles].sort(() => Math.random() - 0.5).slice(0, count);
  const out = [];
  for (const title of chosen) {
    try {
      const url = `https://es.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages` +
        `&explaintext=1&redirects=1&titles=${encodeURIComponent(title)}` +
        `&format=json&formatversion=2&piprop=thumbnail&pithumbsize=800`;
      const data = await httpGet(url);
      const page = data?.query?.pages?.[0];
      if (!page || page.missing || !page.extract) continue;
      const full = clean(page.extract, 2500);
      out.push(
        makePost({
          category, subcategory,
          title: page.title || title,
          summary: shortSummary(full),
          extendedContent: full,
          imageUrl: page.thumbnail?.source || null,
          sourceName: "Wikipedia",
          sourceUrl: `https://es.wikipedia.org/wiki/${encodeURIComponent(title)}`,
          lang: "es",
        })
      );
    } catch {
      // si un tema falla, seguimos
    }
  }
  return out;
}
