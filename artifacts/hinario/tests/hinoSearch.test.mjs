import test from "node:test";
import assert from "node:assert/strict";
import { buildHinoIndex, searchHinos } from "../utils/hinoSearch.ts";

const index = buildHinoIndex([
  { numero: 148, titulo: "A luz", letra: "Primeira estrofe\n\n**Coro fiel**" },
  { numero: 48, titulo: "Coração", letra: "Eu creio na promessa de Deus" },
]);
test("searches numbers, titles and lyrics without accents and keeps exact number first", () => {
  assert.deepEqual(
    searchHinos(index, "48").map((r) => r.entry.hino.numero),
    [48, 148],
  );
  assert.equal(searchHinos(index, "coracao")[0].entry.hino.numero, 48);
  assert.equal(searchHinos(index, "promessa")[0].trecho.match, "promessa");
});
test("favorites and empty queries preserve catalog order; previews remove formatting", () => {
  assert.equal(searchHinos(index, "", new Set([48])).length, 1);
  assert.equal(searchHinos(index, "ausente").length, 0);
  assert.equal(index[0].preview, "Primeira estrofe Coro fiel");
});
