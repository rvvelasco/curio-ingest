// sources/countries.js — REST Countries. Keyless. Bandera como imagen.
import { httpGet } from "../config.js";
import { Category, makePost } from "../schema.js";

export async function fetchCountries() {
  const url = "https://restcountries.com/v3.1/all?fields=name,capital,population,region,subregion,flags,area,languages";
  const all = await httpGet(url, { fixture: "countries.json" });

  // Elegimos 8 países al azar por corrida (variedad sin algoritmo).
  const shuffled = [...all].sort(() => Math.random() - 0.5).slice(0, 8);
  return shuffled.map((c) => {
    const name = c.name?.common || "País";
    const capital = (c.capital && c.capital[0]) || "—";
    const pop = c.population ? c.population.toLocaleString("es") : "—";
    const langs = c.languages ? Object.values(c.languages).join(", ") : "—";
    return makePost({
      category: Category.GEOGRAFIA,
      title: name,
      summary: `${name} está en ${c.subregion || c.region || "el mundo"}. Su capital es ${capital} ` +
        `y tiene alrededor de ${pop} habitantes.`,
      curiousFact: `Idiomas: ${langs}. Superficie: ${c.area ? c.area.toLocaleString("es") + " km²" : "—"}.`,
      whyItMatters: "Conocer el mundo amplía la perspectiva sobre culturas, economías e historia.",
      imageUrl: c.flags?.png || c.flags?.svg || null,
      sourceName: "REST Countries",
      sourceUrl: `https://es.wikipedia.org/wiki/${encodeURIComponent(name)}`,
    });
  });
}
