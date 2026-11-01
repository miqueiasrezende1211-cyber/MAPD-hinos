import type { Hino } from "../data/hinos";

export type IndexedHino = {
  hino: Hino;
  preview: string;
  title: string;
  lyrics: string;
  normalizedLyrics: string;
};
export type SearchResult = {
  entry: IndexedHino;
  trecho?: { antes: string; match: string; depois: string };
};

export function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function buildHinoIndex(hinos: Hino[]): IndexedHino[] {
  return hinos.map((hino) => {
    const lyrics = hino.letra.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
    return {
      hino,
      lyrics,
      normalizedLyrics: normalizeSearch(lyrics),
      title: normalizeSearch(hino.titulo),
      preview: lyrics.length > 70 ? `${lyrics.slice(0, 70)}…` : lyrics,
    };
  });
}

export function searchHinos(
  index: IndexedHino[],
  query: string,
  favorites?: ReadonlySet<number>,
): SearchResult[] {
  const term = query.trim();
  const normalized = normalizeSearch(term);
  const primary: SearchResult[] = [];
  const lyricsResults: SearchResult[] = [];
  for (const entry of index) {
    if (favorites && !favorites.has(entry.hino.numero)) continue;
    if (
      !normalized ||
      String(entry.hino.numero).includes(term) ||
      entry.title.includes(normalized)
    ) {
      primary.push({ entry });
      continue;
    }
    const offset = entry.normalizedLyrics.indexOf(normalized);
    if (offset < 0) continue;
    const start = Math.max(0, offset - 28);
    const end = Math.min(entry.lyrics.length, offset + normalized.length + 28);
    lyricsResults.push({
      entry,
      trecho: {
        antes: `${start > 0 ? "…" : ""}${entry.lyrics.slice(start, offset)}`,
        match: entry.lyrics.slice(offset, offset + normalized.length),
        depois: `${entry.lyrics.slice(offset + normalized.length, end)}${end < entry.lyrics.length ? "…" : ""}`,
      },
    });
  }
  // An exact number is the fastest way to choose a hymn during a service.
  if (/^\d+$/.test(term)) {
    const exact = primary.findIndex(
      ({ entry }) => entry.hino.numero === Number(term),
    );
    if (exact > 0) primary.unshift(...primary.splice(exact, 1));
  }
  return primary.concat(lyricsResults);
}
