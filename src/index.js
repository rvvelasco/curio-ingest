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

const SOURCES = [
  ["Wikipedia · Efemérides", fetchWikipediaOnThisDay],
  ["Spaceflight News", fetchSpaceflight],
  ["arXiv · IA", fetchArxivAI],
  ["Lichess · Puzzle", fetchLichessDailyPuzzle],
  ["Hacker News", fetchHackerNews],
  ["Stockfish · Releases", fetchStockfishReleases],
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
  console.log(`\n💾 Escrito en /out: ${total} posts en ${categories} categorías.`);
  console.log(`   feed_all.json · index.json · feed_<CATEGORIA>.json\n`);
}

run().catch((e) => {
  console.error("Fallo fatal del pipeline:", e);
  process.exit(1);
});
