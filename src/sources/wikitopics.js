// sources/wikitopics.js — Adaptador REUTILIZABLE de temas de Wikipedia.
// Con una lista curada de títulos por categoría, trae tarjetas con imagen y resumen.
// Rota los temas en cada corrida (variedad sin algoritmo).
import { httpGet, DEMO } from "../config.js";
import { makePost } from "../schema.js";

// Listas curadas por categoría (títulos reales de Wikipedia en español).
export const SEEDS = {
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

/** Trae hasta `count` temas (al azar) de una categoría, con imagen y resumen de Wikipedia. */
export async function wikiTopics(category, titles, { count = 5, subcategory = null } = {}) {
  if (DEMO) {
    return titles.slice(0, 2).map((t) =>
      makePost({
        category, subcategory,
        title: t,
        summary: `(demo) Resumen de "${t}". En la corrida real, Wikipedia trae el texto e imagen.`,
        sourceName: "Wikipedia",
        sourceUrl: `https://es.wikipedia.org/wiki/${encodeURIComponent(t)}`,
      })
    );
  }

  const chosen = [...titles].sort(() => Math.random() - 0.5).slice(0, count);
  const out = [];
  for (const title of chosen) {
    try {
      const url = `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
      const s = await httpGet(url);
      if (!s || s.type === "disambiguation" || !s.extract) continue;
      out.push(
        makePost({
          category, subcategory,
          title: s.title || title,
          summary: s.extract,
          imageUrl: s.thumbnail?.source || null,
          sourceName: "Wikipedia",
          sourceUrl: s.content_urls?.desktop?.page ||
            `https://es.wikipedia.org/wiki/${encodeURIComponent(title)}`,
        })
      );
    } catch {
      // si un tema falla, seguimos con el resto
    }
  }
  return out;
}
