import { expandTabs, isChordLine, parseChord } from "./parseCifra";

const SHARPS = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];
const FLATS = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const NOTES: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

function transposeNote(
  root: string,
  accidental: string,
  semitones: number,
): string {
  const value =
    NOTES[root] + (accidental === "#" ? 1 : accidental === "b" ? -1 : 0);
  return (semitones < 0 ? FLATS : SHARPS)[
    (((value + semitones) % 12) + 12) % 12
  ];
}

export function transporAcorde(token: string, semitons: number): string {
  const chord = parseChord(token);
  if (!chord || !semitons || !Number.isInteger(semitons)) return token;
  return (
    transposeNote(chord.root, chord.accidental, semitons) +
    chord.suffix +
    (chord.bass
      ? `/${transposeNote(chord.bass, chord.bassAccidental ?? "", semitons)}`
      : "")
  );
}

/** Rebuild from original anchors: growing chords consume padding, never tokens. */
export function transporCifra(cifra: string, semitons: number): string {
  if (!semitons || !Number.isInteger(semitons)) return cifra;
  return cifra
    .split("\n")
    .map((rawLine) => {
      const line = expandTabs(rawLine);
      if (!isChordLine(line)) return rawLine;
      let result = "";
      for (const match of line.matchAll(/\S+/g)) {
        const column = Math.max(
          match.index,
          result.length ? result.length + 1 : 0,
        );
        result +=
          " ".repeat(column - result.length) +
          transporAcorde(match[0], semitons);
      }
      return result;
    })
    .join("\n");
}

export function formatarSemitons(semitons: number): string {
  return semitons > 0 ? `+${semitons}` : `${semitons}`;
}

export function transporTom(
  tom: string | null | undefined,
  semitons: number,
): string | null {
  if (!tom) return null;
  return transporAcorde(tom.trim(), semitons);
}
