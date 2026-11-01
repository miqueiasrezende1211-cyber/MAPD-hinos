import test from "node:test";
import assert from "node:assert/strict";
import { parseLetra } from "../utils/parseLetra.ts";

test("labels verses and explicit chorus without changing text", () => {
  const blocks = parseLetra(
    "Primeira linha\nSegunda linha\n\n**Coro repetido\nOutra linha**\n\nÚltima estrofe",
  );
  assert.deepEqual(
    blocks.map((b) => [b.tipo, b.label]),
    [
      ["estrofe", "Estrofe 1"],
      ["coro", "Coro"],
      ["estrofe", "Estrofe 2"],
    ],
  );
  assert.equal(blocks[0].spans[0].text, "Primeira linha\nSegunda linha");
  assert.equal(blocks[1].spans[0].text, "Coro repetido\nOutra linha");
});

test("keeps partial emphasis, repeat instructions and named sections", () => {
  const blocks = parseLetra(
    "Letra **(2x)**\n\n**PONTE**\nTexto da ponte\n\n**Proclamação**\nPalavra\n\n**(2x)**",
  );
  assert.deepEqual(
    blocks.map((b) => b.tipo),
    ["estrofe", "secao", "secao", "estrofe"],
  );
  assert.deepEqual(blocks[0].spans, [
    { text: "Letra ", emphasis: false },
    { text: "(2x)", emphasis: true },
  ]);
  assert.equal(blocks[1].label, "Ponte");
  assert.equal(blocks[1].spans[0].text, "Texto da ponte");
});

test("recognizes explicit chorus heading and preserves unknown/unpaired markup", () => {
  const blocks = parseLetra(
    "(Coro)\nCantamos juntos\n\n**Primeiro** e **segundo**\n\nTexto **sem fechamento",
  );
  assert.equal(blocks[0].tipo, "coro");
  assert.equal(blocks[1].tipo, "estrofe");
  assert.equal(
    blocks[1].spans.map((s) => s.text).join(""),
    "Primeiro e segundo",
  );
  assert.equal(blocks[2].spans[0].text, "Texto **sem fechamento");
  assert.deepEqual(parseLetra(" \r\n "), []);
});

test("standalone section headings name only the following paragraph", () => {
  const blocks = parseLetra(
    "(Coro)\n\nCantamos juntos\nCom alegria\n\nNova estrofe\n\n**PONTE**\n\nTexto **com ênfase**\n\nÚltima estrofe",
  );
  assert.deepEqual(
    blocks.map((block) => [block.tipo, block.label]),
    [
      ["coro", "Coro"],
      ["estrofe", "Estrofe 1"],
      ["secao", "Ponte"],
      ["estrofe", "Estrofe 2"],
    ],
  );
  assert.deepEqual(
    blocks.map((block) => block.spans.map((span) => span.text).join("")),
    [
      "Cantamos juntos\nCom alegria",
      "Nova estrofe",
      "Texto com ênfase",
      "Última estrofe",
    ],
  );
  assert.equal(blocks[2].spans[1].emphasis, true);
  assert.deepEqual(parseLetra("(Coro)"), [
    { tipo: "coro", label: "Coro", spans: [] },
  ]);
});
