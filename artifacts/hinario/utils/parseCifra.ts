export type Chord = {
  root: string;
  accidental: string;
  suffix: string;
  bass?: string;
  bassAccidental?: string;
};

// Restrict suffixes to musical notation. Words such as "Amor" and "Coro"
// must never be mistaken for chords and transposed.
const DEGREE = "(?:13|11|[245679])";
const QUALITY = "(?:maj|min|dim|aug|m|M|[º°ø+\\-])";
const EXTENSION = `${DEGREE}(?:M|maj|[+\\-])?`;
const PAREN_MODIFIER = `(?:maj(?:13|11|[679])|add(?:13|11|[2469])|sus[24]?|[#b]?${EXTENSION})`;
const SUFFIX = new RegExp(
  `^${QUALITY}?(?:${EXTENSION}|maj(?:13|11|[679]))?` +
    `(?:sus[24]?|add(?:13|11|[2469])|[#b]${DEGREE}|\\/${DEGREE}|` +
    `\\(${PAREN_MODIFIER}(?:[,/]${PAREN_MODIFIER})*\\))*$`,
);

export function parseChord(token: string): Chord | null {
  const normalized = token.replace(/♭/g, "b").replace(/♯/g, "#");
  const match = /^([A-G])([#b]?)(.*?)(?:\/([A-G])([#b]?))?$/.exec(normalized);
  if (!match || !SUFFIX.test(match[3])) return null;
  return {
    root: match[1],
    accidental: match[2],
    suffix: match[3],
    bass: match[4],
    bassAccidental: match[5],
  };
}

const SEPARATOR = /^(?:\|:?|:?\|\|?|%|\(?\d+x\)?)$/i;

export function isChordLine(line: string): boolean {
  const tokens = line.trim().split(/\s+/).filter(Boolean);
  return (
    tokens.some((token) => parseChord(token) !== null) &&
    tokens.every((token) => parseChord(token) !== null || SEPARATOR.test(token))
  );
}

export type CifraLine = {
  text: string;
  kind: "chords" | "lyrics" | "instruction";
};
export type CifraBlock = {
  label: string;
  kind: "verse" | "chorus" | "section";
  lines: CifraLine[];
};

function sectionLabel(line: string): string | null {
  const text = line
    .trim()
    .replace(/^\*\*|\*\*$/g, "")
    .replace(/^[([]|[)\]]$/g, "")
    .replace(/:$/, "")
    .trim();
  return /^(?:coro|refrão|refrao|ponte|proclamação|proclamacao|intro(?:dução|ducao)?|interlúdio|interludio|final|estrofe(?:\s+\d+)?)(?:\s*\(?\d+x\)?)?$/i.test(
    text,
  )
    ? text
    : null;
}

/** Expands tabs to their column stops; never collapse spaces used as anchors. */
export function expandTabs(line: string): string {
  let result = "";
  for (const char of line)
    result += char === "\t" ? " ".repeat(4 - (result.length % 4)) : char;
  return result;
}

export function parseCifra(raw: string): CifraBlock[] {
  const blocks: CifraBlock[] = [];
  let current: CifraBlock | undefined;
  let verse = 0;
  const start = (label?: string) => {
    current = {
      label: label ?? `Estrofe ${++verse}`,
      kind: label
        ? /^(coro|refrão|refrao)/i.test(label)
          ? "chorus"
          : "section"
        : "verse",
      lines: [],
    };
  };
  const finish = () => {
    if (current?.lines.length) blocks.push(current);
    current = undefined;
  };
  for (const rawLine of raw.replace(/\r\n?/g, "\n").split("\n")) {
    const line = expandTabs(rawLine);
    if (!line.trim()) {
      if (current?.lines.length) finish();
      continue;
    }
    const label = sectionLabel(line);
    if (label) {
      finish();
      start(label);
      continue;
    }
    if (!current) start();
    current!.lines.push({
      text: line,
      kind: isChordLine(line)
        ? "chords"
        : /^\s*[([][^)\]]+[)\]]\s*$/.test(line)
          ? "instruction"
          : "lyrics",
    });
  }
  finish();
  return blocks;
}
