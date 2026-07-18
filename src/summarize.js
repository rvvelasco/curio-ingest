// ============================================================================
// summarize.js  —  ENRIQUECEDOR CON IA (opcional, gratis, con fallback total)
//
// - Usa cualquier endpoint compatible con OpenAI. Recomendado GRATIS:
//     Gemini (Google AI Studio):
//       AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
//       AI_MODEL=gemini-2.5-flash-lite
//     Groq (respaldo):
//       AI_BASE_URL=https://api.groq.com/openai/v1
//       AI_MODEL=llama-3.1-8b-instant
// - Si NO hay AI_API_KEY, o se agota el tope AI_MAX_CALLS, o falla la llamada,
//   devuelve el Post tal cual (con el resumen crudo de la fuente). Cero costo, cero riesgo.
// ============================================================================

const BASE_URL = process.env.AI_BASE_URL || "";
const API_KEY = process.env.AI_API_KEY || "";
const MODEL = process.env.AI_MODEL || "gemini-2.5-flash-lite";
const MAX_CALLS = parseInt(process.env.AI_MAX_CALLS || "300", 10); // tope diario de seguridad

const AI_ENABLED = Boolean(BASE_URL && API_KEY);
let callsMade = 0;

const SYSTEM_PROMPT = `Eres un editor que convierte información cruda en una tarjeta de aprendizaje breve, SIEMPRE en español neutro (traduce si el texto está en otro idioma).
Devuelve SOLO un objeto JSON válido, sin markdown ni texto extra, con estas claves exactas:
{"title": "...", "summary": "...", "curiousFact": "...", "whyItMatters": "..."}
Reglas:
- Todo en español, aunque la fuente esté en inglés.
- "title": atractivo, claro, máx 90 caracteres. No clickbait, no inventar.
- "summary": 3 a 4 frases que se entiendan SIN contexto previo. Basado SOLO en el texto dado; no inventes datos.
- "curiousFact": un dato curioso corto y verificable relacionado al tema.
- "whyItMatters": 1 frase explicando por qué esto importa o qué enseña.
Si el texto es muy pobre, sé conservador y no inventes.`;

export function aiStatus() {
  return { enabled: AI_ENABLED, model: AI_ENABLED ? MODEL : null, callsMade, maxCalls: MAX_CALLS };
}

export async function enhancePost(post) {
  if (!AI_ENABLED || callsMade >= MAX_CALLS) return post; // fallback: resumen de la fuente
  try {
    callsMade++;
    const userMsg =
      `Categoría: ${post.category}\n` +
      `Fuente: ${post.sourceName}\n` +
      `Título original: ${post.title}\n` +
      `Texto: ${post.summary}`;
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMsg },
        ],
      }),
    });
    if (!res.ok) throw new Error(`IA HTTP ${res.status}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    const parsed = safeParseJson(text);
    if (!parsed) return post;
    return {
      ...post,
      title: parsed.title?.trim() || post.title,
      summary: parsed.summary?.trim() || post.summary,
      curiousFact: parsed.curiousFact?.trim() || post.curiousFact,
      whyItMatters: parsed.whyItMatters?.trim() || post.whyItMatters,
      lang: "es",
      aiEnhanced: true,
    };
  } catch (e) {
    console.warn(`  ⚠️  IA falló (${e.message}); uso el resumen de la fuente.`);
    return post; // fallback total
  }
}

function safeParseJson(text) {
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}
