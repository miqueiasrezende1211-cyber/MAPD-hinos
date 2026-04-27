const NOTAS_SUSTENIDO = [
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

const NOTAS_BEMOL = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
];

const MAPA_NOTAS: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

function normalizarAcidente(s: string): string {
  return s.replace(/♭/g, "b").replace(/♯/g, "#");
}

function transporNota(
  raiz: string,
  acidente: string,
  semitons: number,
  preferirBemol: boolean,
): string {
  const nota = raiz + (acidente || "");
  const idx = MAPA_NOTAS[nota];
  if (idx === undefined) return nota;
  const novoIdx = ((idx + semitons) % 12 + 12) % 12;
  return preferirBemol ? NOTAS_BEMOL[novoIdx] : NOTAS_SUSTENIDO[novoIdx];
}

const REGEX_ACORDE =
  /^([A-G])([#b♭♯]?)([^/\s]*?)(?:\/([A-G])([#b♭♯]?)([^/\s]*)?)?$/;

function ehAcorde(token: string): boolean {
  return REGEX_ACORDE.test(token);
}

function transporAcorde(
  token: string,
  semitons: number,
  preferirBemol: boolean,
): string {
  const t = normalizarAcidente(token);
  const m = REGEX_ACORDE.exec(t);
  if (!m) return token;
  const [, raiz, acidente, sufixo, bRaiz, bAcid, bSufixo] = m;
  let resultado =
    transporNota(raiz, acidente, semitons, preferirBemol) + (sufixo || "");
  if (bRaiz) {
    resultado +=
      "/" +
      transporNota(bRaiz, bAcid, semitons, preferirBemol) +
      (bSufixo || "");
  }
  return resultado;
}

function ehLinhaDeAcordes(linha: string): boolean {
  const tokens = linha.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;
  return tokens.every((t) => ehAcorde(t));
}

export function transporCifra(cifra: string, semitons: number): string {
  if (!semitons) return cifra;
  const preferirBemol = semitons < 0;
  const linhas = cifra.split("\n");
  return linhas
    .map((linha) => {
      if (!ehLinhaDeAcordes(linha)) return linha;
      const regexToken = /\S+/g;
      let resultado = "";
      let cursor = 0;
      let m: RegExpExecArray | null;
      while ((m = regexToken.exec(linha)) !== null) {
        const inicio = m.index;
        const fim = inicio + m[0].length;
        resultado += linha.slice(cursor, inicio);
        const novo = transporAcorde(m[0], semitons, preferirBemol);
        resultado += novo;
        const diff = novo.length - m[0].length;
        cursor = fim;
        if (diff > 0) {
          const restoEspacos =
            linha.slice(cursor).match(/^ +/)?.[0].length ?? 0;
          const consumir = Math.min(diff, restoEspacos);
          cursor += consumir;
        } else if (diff < 0) {
          resultado += " ".repeat(-diff);
        }
      }
      resultado += linha.slice(cursor);
      return resultado.trimEnd();
    })
    .join("\n");
}

export function formatarSemitons(semitons: number): string {
  if (semitons === 0) return "0";
  return semitons > 0 ? `+${semitons}` : `${semitons}`;
}

export function transporTom(
  tom: string | null | undefined,
  semitons: number,
): string | null {
  if (!tom) return null;
  if (!semitons) return tom;
  const t = normalizarAcidente(tom.trim());
  const m = /^([A-G])([#b]?)(.*)$/.exec(t);
  if (!m) return tom;
  const [, raiz, acidente, sufixo] = m;
  return (
    transporNota(raiz, acidente, semitons, semitons < 0) + (sufixo || "")
  );
}
