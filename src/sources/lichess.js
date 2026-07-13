// sources/lichess.js — Puzzle del día de Lichess. Keyless. Categoria AJEDREZ.
import { httpGet } from "../config.js";
import { Category, makePost } from "../schema.js";

export async function fetchLichessDailyPuzzle() {
  const url = "https://lichess.org/api/puzzle/daily";
  const data = await httpGet(url, { fixture: "lichess.json" });

  const puzzle = data.puzzle || {};
  const themes = (puzzle.themes || []).slice(0, 4).join(", ");
  const id = puzzle.id || "";
  return [
    makePost({
      category: Category.AJEDREZ,
      subcategory: "Problemas diarios",
      title: "Puzzle de ajedrez del día",
      summary:
        `Un problema táctico para resolver hoy. Rating ${puzzle.rating || "?"}, ` +
        `jugado ${puzzle.plays || "?"} veces.` + (themes ? ` Temas: ${themes}.` : ""),
      curiousFact: themes ? `Este puzzle entrena: ${themes}.` : null,
      whyItMatters:
        "Resolver un problema táctico por día es una de las formas más efectivas de mejorar en ajedrez.",
      sourceName: "Lichess",
      sourceUrl: id ? `https://lichess.org/training/${id}` : "https://lichess.org/training/daily",
      publishedAt: Date.now(),
    }),
  ];
}
