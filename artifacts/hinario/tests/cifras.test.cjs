const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

// Exercise the same pure TS modules used by Expo without a native runtime.
const modules = new Map();
function load(relativePath) {
  const filename = path.resolve(__dirname, relativePath);
  if (modules.has(filename)) return modules.get(filename);
  const exports = {};
  modules.set(filename, exports);
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const localRequire = (name) =>
    name.startsWith(".")
      ? load(
          path.relative(
            __dirname,
            path.resolve(path.dirname(filename), `${name}.ts`),
          ),
        )
      : require(name);
  vm.runInThisContext(`(function(require, exports) { ${compiled}\n})`, {
    filename,
  })(localRequire, exports);
  return exports;
}
const { parseChord, isChordLine, parseCifra } = load("../utils/parseCifra.ts");
const { transporCifra, transporAcorde, transporTom } = load(
  "../utils/transposeCifra.ts",
);

test("only musical tokens are recognized as chords", () => {
  for (const chord of [
    "C",
    "Am",
    "Bdim",
    "C#º",
    "Faug",
    "Gsus4",
    "Dadd9",
    "Bbmaj7",
    "C7M",
    "Am7(b5)",
    "D7(#9,b13)",
    "C7/9",
    "F#m7/C#",
    "B♭7/D",
    "Eø",
  ])
    assert.ok(parseChord(chord), chord);
  for (const word of [
    "Amor",
    "Coro",
    "Deus",
    "Final",
    "Aleluia",
    "Bom",
    "Gente",
    "C/Am",
    "C(foo)",
  ])
    assert.equal(parseChord(word), null, word);
  assert.equal(isChordLine("A pomba pousou em meu coração"), false);
  assert.equal(isChordLine("|: C  Am7  D/F# :| (2x)"), true);
});

test("transpose keeps lyric text and slash bass musical", () => {
  assert.equal(transporAcorde("F#m7/C#", 1), "Gm7/D");
  assert.equal(transporAcorde("Bbmaj7/D", -1), "Amaj7/Db");
  assert.equal(transporTom("Am", 1), "A#m");
  assert.equal(transporTom("Não informado", 1), "Não informado");
  const text = "  C     F#m  G7\nAmor, Deus é bom\n(Coro)\n  A   E/G#";
  for (const semitones of [-11, 0, 11]) {
    const lines = transporCifra(text, semitones).split("\n");
    assert.equal(lines[1], "Amor, Deus é bom");
    assert.equal(lines[2], "(Coro)");
  }
  assert.equal(transporCifra(text, 0), text);
});

test("common suffixes transpose the complete chord line without changing lyrics", () => {
  const tokens = ["C7+", "Bb7+", "Cm(maj7)", "C(add9)"];
  tokens.forEach((token) => assert.ok(parseChord(token), token));
  const text = `${tokens.join("    ")}    F\nAmor de Deus e Coro continuam como texto`;
  assert.equal(isChordLine(text.split("\n")[0]), true);
  const result = transporCifra(text, 1).split("\n");
  assert.deepEqual(result[0].trim().split(/\s+/), [
    "C#7+",
    "B7+",
    "C#m(maj7)",
    "C#(add9)",
    "F#",
  ]);
  assert.equal(result[1], text.split("\n")[1]);
  for (const unknown of ["C(unknown)", "C7(hello)", "C7++", "Bbfoo"]) {
    assert.equal(parseChord(unknown), null, unknown);
    assert.equal(
      transporCifra(`${unknown} e uma instrução`, 1),
      `${unknown} e uma instrução`,
    );
  }
});

test("chord growth consumes padding without duplication and preserves original anchors", () => {
  assert.equal(transporCifra("  C     G     Am", 1), "  C#    G#    A#m");
  assert.equal(transporCifra("C G A", 1), "C# G# A#");
  assert.equal(transporCifra("C#    D#   F#m", -1), "C     D    Fm");
  assert.equal(transporCifra("C\tG", 1), "C#  G#");
});

test("section labels are explicit and leading alignment is retained", () => {
  const blocks = parseCifra(
    "  C  G\nAmor de Deus\n\n(Coro)\n    F\nCanta\n\n[Ponte]\nAm\n(2x)",
  );
  assert.equal(blocks.length, 3);
  assert.equal(blocks[0].label, "Estrofe 1");
  assert.equal(blocks[0].lines[0].text, "  C  G");
  assert.equal(blocks[1].kind, "chorus");
  assert.equal(blocks[2].label, "Ponte");
  assert.equal(blocks[2].lines[1].kind, "instruction");
  assert.equal(parseCifra("(Coro)\n\nC\nAleluia")[0].kind, "chorus");
});

test("local cifras 488 and 679 retain all lyric lines at transposition limits", () => {
  const { cifras } = load("../data/cifras.ts");
  for (const number of [488, 679]) {
    const original = cifras[number].split("\n");
    for (const semitones of [-11, 0, 11]) {
      const result = transporCifra(cifras[number], semitones).split("\n");
      assert.equal(result.length, original.length);
      original.forEach((line, index) => {
        if (!isChordLine(line)) assert.equal(result[index], line);
        else
          assert.equal(
            result[index].trim().split(/\s+/).length,
            line.trim().split(/\s+/).length,
          );
      });
    }
  }
  assert.equal(
    parseCifra(cifras[488]).filter((block) => block.kind === "chorus").length,
    1,
  );
});
