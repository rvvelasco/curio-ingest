// ============================================================================
// index.js  —  ORQUESTADOR del pipeline
//   1. Corre todas las fuentes (una falla no rompe el resto).
//   2. Deduplica.
//   3. Enriquece con IA (opcional, con tope y fallback).
//   4. Fusiona con lo previo y escribe JSON estático en /out.
// ============================================================================

import { DEMO } from "./config.js";
import { dedupe, mergeAndWrite } from "./store.js";
import { enhancePost, aiStatus } from "./summarize.js";

import { fetchWikipediaOnThisDay } from "./sources/wikipedia.js";
import { fetchSpaceflight } from "./sources/spaceflight.js";
import { fetchArxivAI } from "./sources/arxiv.js";
import { fetchLichessDailyPuzzle } from "./sources/lichess.js";
import { fetchHackerNews } from "./sources/hackernews.js";
import { fetchStockfishReleases } from "./sources/stockfish.js";
import { fetchNasaApod } from "./sources/nasa.js";
import { fetchCountries } from "./sources/countries.js";
import { fetchOpenLibrary } from "./sources/openlibrary.js";
import { fetchWikiFeatured } from "./sources/wikiculture.js";
import { fetchBirthsToday } from "./sources/biographies.js";
import { wikiTopics, SEEDS } from "./sources/wikitopics.js";
import { gdeltNews } from "./sources/gdeltnews.js";
import { Category } from "./schema.js";

const SOURCES = [
  ["Wikipedia · Efemérides", fetchWikipediaOnThisDay],
  ["Spaceflight News", fetchSpaceflight],
  ["NASA · APOD (imágenes)", fetchNasaApod],
  ["arXiv · IA", fetchArxivAI],
  ["Lichess · Puzzle", fetchLichessDailyPuzzle],
  ["Hacker News", fetchHackerNews],
  ["Stockfish · Releases", fetchStockfishReleases],
  ["REST Countries · Geografía", fetchCountries],
  ["Open Library · Libros", fetchOpenLibrary],
  ["Wikipedia · Cultura", fetchWikiFeatured],
  ["Wikipedia · Biografías", fetchBirthsToday],
  // Temas curados de Wikipedia (con imagen) para llenar el resto de categorías:
  ["Filosofía", () => wikiTopics(Category.FILOSOFIA, SEEDS.FILOSOFIA)],
  ["Estoicismo", () => wikiTopics(Category.ESTOICISMO, SEEDS.ESTOICISMO)],
  ["Ciencia", () => wikiTopics(Category.CIENCIA, SEEDS.CIENCIA)],
  ["Avances científicos", () => wikiTopics(Category.AVANCES, SEEDS.AVANCES)],
  ["Economía", () => wikiTopics(Category.ECONOMIA, SEEDS.ECONOMIA)],
  ["Finanzas", () => wikiTopics(Category.FINANZAS, SEEDS.FINANZAS)],
  ["Negocios", () => wikiTopics(Category.NEGOCIOS, SEEDS.NEGOCIOS)],
  ["Emprendimiento", () => wikiTopics(Category.EMPRENDIMIENTO, SEEDS.EMPRENDIMIENTO)],
  // Noticias reales (GDELT, sin key):
  ["Noticias · Tecnología", () => gdeltNews(Category.NOTICIAS_TEC, "tecnología")],
  ["Noticias · Ciencia", () => gdeltNews(Category.NOTICIAS_CIEN, "ciencia")],
  ["Noticias · Economía", () => gdeltNews(Category.NOTICIAS_ECO, "economía")],
];

async function run() {
  console.log(`\n🌀 Curio ingest ${DEMO ? "(modo DEMO / fixtures)" : "(en vivo)"}\n`);

  // 1 + 2: traer de todas las fuentes en paralelo, resiliente.
  const results = await Promise.allSettled(
    SOURCES.map(async ([name, fn]) => {
      const posts = await fn();
      console.log(`  ✅ ${name}: ${posts.length} items`);
      return posts;
    })
  );
  results.forEach((r, i) => {
    if (r.status === "rejected")
      console.log(`  ❌ ${SOURCES[i][0]}: ${r.reason?.message || r.reason}`);
  });

  let posts = dedupe(results.filter((r) => r.status === "fulfilled").flatMap((r) => r.value));
  console.log(`\n📦 ${posts.length} items únicos tras dedupe.`);

  // 3: enriquecer con IA (si hay clave; si no, pasa de largo).
  const ai = aiStatus();
  if (ai.enabled) {
    console.log(`🤖 IA activada (${ai.model}), tope ${ai.maxCalls} llamadas.`);
    posts = [];
    const raw = dedupe(results.filter((r) => r.status === "fulfilled").flatMap((r) => r.value));
    for (const p of raw) posts.push(await enhancePost(p));
    console.log(`🤖 IA usada en ${aiStatus().callsMade} items.`);
  } else {
    console.log("🤖 IA desactivada (sin AI_API_KEY) → uso resúmenes de la fuente. $0.");
  }

  // 4: fusionar con lo previo y escribir.
  const { total, categories } = await mergeAndWrite(posts);
  console.log(`\n💾 Escrito en /docs: ${total} posts en ${categories} categorías.`);
  console.log(`   feed_all.json · index.json · feed_<CATEGORIA>.json\n`);
}

run().catch((e) => {
  console.error("Fallo fatal del pipeline:", e);
  process.exit(1);
});
