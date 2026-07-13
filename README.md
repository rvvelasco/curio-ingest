# Curio · Pipeline de ingesta

El "cerebro" de contenido de la app **Curio**. Corre fuera del teléfono, trae contenido de
APIs gratuitas, lo normaliza a **un único formato** (`Post`), opcionalmente lo mejora con IA
gratis, y publica **JSON estático** que la app Android consume.

Todo esto está pensado para funcionar a **costo $0**.

---

## Qué hace

```
Fuentes (APIs) → Adaptadores → Normalizador → IA (opcional, gratis) → dedupe → JSON en /out
```

1. **Trae** de varias fuentes en paralelo (si una falla, el resto sigue).
2. **Normaliza** todo al esquema `Post` (mismo contrato que usará Room en Android).
3. **Mejora con IA** (opcional): reescribe título, resumen, dato curioso y "por qué importa".
   Si no hay clave o se agota la cuota gratis, usa el resumen de la fuente. **Cero costo.**
4. **Deduplica** por `id` estable.
5. **Fusiona** con lo previo (ventana deslizante) y **escribe** `out/feed_all.json`,
   `out/index.json` y un `out/feed_<CATEGORIA>.json` por categoría.

Fuentes ya incluidas (todas **sin API key**):
| Fuente | Categoría | Key |
|---|---|---|
| Wikipedia · Efemérides ("On this day") | Historia | 🔓 no |
| Spaceflight News API v4 | Espacio | 🔓 no |
| arXiv (cs.AI) | IA | 🔓 no |
| Lichess · Puzzle del día | Ajedrez | 🔓 no |
| Hacker News (Algolia) | Tecnología | 🔓 no |
| GitHub Releases · Stockfish | Ajedrez | 🔓 no |

> Agregar una fuente nueva = escribir **un** archivo en `src/sources/` que devuelva
> `Post[]` con `makePost(...)`. Nada más se toca. (Ese es el punto del diseño.)

---

## Correr localmente

```bash
# Node 20+
node src/index.js            # en vivo (llama a las APIs reales)
node src/index.js --demo     # offline, usa fixtures de ejemplo (sirve para probar rápido)
```

La salida queda en `docs/`.

---

## Activar la IA gratis (opcional)

Sin clave, el pipeline funciona igual usando los resúmenes de la fuente. Para mejorar la
calidad de las tarjetas, definí estas variables de entorno con **cualquiera** de las dos
opciones gratuitas:

**Opción 1 — Gemini (Google AI Studio), recomendada (más cuota gratis):**
```bash
export AI_BASE_URL="https://generativelanguage.googleapis.com/v1beta/openai"
export AI_MODEL="gemini-2.5-flash-lite"
export AI_API_KEY="tu_api_key_de_ai_studio"
export AI_MAX_CALLS="300"     # tope de seguridad por corrida
```

**Opción 2 — Groq (respaldo, muy rápido):**
```bash
export AI_BASE_URL="https://api.groq.com/openai/v1"
export AI_MODEL="llama-3.1-8b-instant"
export AI_API_KEY="tu_api_key_de_groq"
```

- Se llama **una sola vez por ítem** (nunca se re-resume lo ya procesado).
- `AI_MAX_CALLS` evita cualquier sorpresa: al llegar al tope, cae al resumen de la fuente.

---

## Mantenerlo actualizado gratis (GitHub Actions)

`.github/workflows/ingest.yml` ya está listo:
1. Subí este proyecto a un repo de GitHub (público = Actions gratis ilimitado).
2. (Opcional) Settings → Secrets → agregá `AI_API_KEY`.
3. Corre **cada 3 horas** por cron y commitea el JSON en `docs/`.
4. Activá **GitHub Pages** apuntando a la carpeta `docs/` para servir los JSON por HTTPS.
   La app Android leerá, por ejemplo:
   `https://TU_USUARIO.github.io/curio-ingest/feed_all.json`

Cero servidores, cero costo.

---

## El contrato de datos (`Post`)

Cada tarjeta del feed tiene **exactamente** esta forma, venga de la API que venga. Este mismo
esquema se replica como entidad Room en la app Android:

```json
{
  "id": "hash-estable-para-dedupe",
  "category": "HISTORIA",
  "subcategory": null,
  "title": "1969: Apolo 11",
  "summary": "2-3 frases claras que se entienden sin contexto…",
  "curiousFact": "Un dato curioso…",
  "whyItMatters": "Por qué esto importa…",
  "imageUrl": "https://… (o null → la app usa fallback por categoría)",
  "sourceName": "Wikipedia",
  "sourceUrl": "https://… (botón 'Leer fuente original')",
  "publishedAt": 1783706400000,
  "fetchedAt": 1783961369319,
  "readingSeconds": 60,
  "extendedContent": null,
  "aiEnhanced": false
}
```

`index.json` lista las categorías con su emoji, label y color de acento (para el fallback
visual y los chips de categoría en la app).

---

## Próximos pasos del roadmap

- **Fase 1 (siguiente):** app Android — feed infinito con Paging 3 + Room + Coil leyendo estos JSON.
- **Fase 3:** activar IA + sumar el resto de fuentes (Guardian, NewsData, REST Countries,
  Open Library, World Bank, Chess.com, más ajedrez, filosofía, estoicismo, etc.).
