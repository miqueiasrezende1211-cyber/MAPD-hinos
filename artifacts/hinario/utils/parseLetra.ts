export type LetraSpan = { text: string; emphasis: boolean };
export type LetraBlock = {
  tipo: "estrofe" | "coro" | "secao";
  label: string;
  spans: LetraSpan[];
};

export function parseInlineEmphasis(text: string): LetraSpan[] {
  const spans: LetraSpan[] = [];
  const pattern = /\*\*([^]*?)\*\*/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor)
      spans.push({ text: text.slice(cursor, match.index), emphasis: false });
    spans.push({ text: match[1], emphasis: true });
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length)
    spans.push({ text: text.slice(cursor), emphasis: false });
  return spans;
}

/** Keep the stored text format; only explicit chorus markers change block semantics. */
export function parseLetra(raw: string): LetraBlock[] {
  let estrofe = 0;
  const blocks: LetraBlock[] = [];
  let pending: Pick<LetraBlock, "tipo" | "label"> | undefined;
  const parts = raw
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim()
    .split(/\n\s*\n/)
    .filter(Boolean);
  for (const part of parts) {
    let text = part.trim();
    const fullyBold =
      /^\*\*[^]*\*\*$/.test(text) && !text.slice(2, -2).includes("**");
    const unwrapped = fullyBold ? text.slice(2, -2).trim() : text;
    const heading =
      /^(?:\*\*)?\(?\s*(Coro|Refr[aã]o|Ponte|Proclama[cç][aã]o|Introdu[cç][aã]o|Final|Estrofe(?:\s+\d+)?|Verso(?:\s+\d+)?)\s*\)?(?:\*\*)?\s*:?\s*(?:\n|$)/i.exec(
        unwrapped,
      );
    if (heading) {
      const name = heading[1];
      const chorus = /^(coro|refr[aã]o)$/i.test(name);
      text = unwrapped.slice(heading[0].length).trim();
      // A label in its own paragraph names the next paragraph, not an empty verse.
      if (pending) blocks.push({ ...pending, spans: [] });
      const section: Pick<LetraBlock, "tipo" | "label"> = {
        tipo: chorus ? "coro" : "secao",
        label: chorus
          ? "Coro"
          : name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
      };
      if (text) {
        blocks.push({ ...section, spans: parseInlineEmphasis(text) });
        pending = undefined;
      } else {
        pending = section;
      }
      continue;
    }
    if (pending) {
      blocks.push({ ...pending, spans: parseInlineEmphasis(text) });
      pending = undefined;
      continue;
    }
    // A standalone repeat instruction is not a chorus.
    const repeatOnly = /^\(?\d+\s*x\)?$/i.test(unwrapped);
    if (fullyBold && !repeatOnly) {
      blocks.push({
        tipo: "coro",
        label: "Coro",
        spans: parseInlineEmphasis(unwrapped),
      });
      continue;
    }
    estrofe += 1;
    blocks.push({
      tipo: "estrofe",
      label: `Estrofe ${estrofe}`,
      spans: parseInlineEmphasis(text),
    });
  }
  // Preserve an unmatched final label instead of silently dropping authored text.
  if (pending) blocks.push({ ...pending, spans: [] });
  return blocks;
}
