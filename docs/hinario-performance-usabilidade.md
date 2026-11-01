# Hinário: implementação e validação

Data: 1 de novembro de 2026.

## Entrega

- Identidade MAPD em todas as telas: azul-marinho, azul, superfícies claras e variante escura, com Inter nos controles e Merriweather na leitura.
- Estrofes numeradas, coros identificados por rótulo e faixa lateral, ênfase parcial preservada e seções como Ponte/Proclamação. A prévia administrativa usa o mesmo parser e componente da leitura.
- Cifras monoespaçadas com acordes destacados, seções identificadas, transposição por posições originais e rolagem horizontal dentro do trecho largo.
- Catálogo disponível pelo bundle e pelo último snapshot persistido; cifras consultadas persistidas por número. Atualizações ocorrem em segundo plano, com timeout de 10 segundos, deduplicação e proteção contra respostas antigas.
- Cadastro, edição e exclusão atualizam os caches imediatamente após sucesso da API. Uma cifra removida fica registrada como ausência, sem ressuscitar o fallback local.
- Busca com índice e previews calculados por catálogo, linhas memoizadas e favoritos consultados com `Set`. Filtros e busca permanecem montados ao navegar para um hino.
- Tamanhos de letra e cifra persistidos separadamente; controles de toque de 48 dp; formulários com rótulos e suporte ao teclado.

As strings de `letra` e `cifra`, o banco e os contratos HTTP foram preservados. Os novos caches usam os prefixos `mapd:catalog:v1` e `mapd:cifra:v1`; favoritos mantêm a chave anterior.

## Verificações executadas

- TypeScript do aplicativo: passou.
- 24 testes de regressão: passaram. Cobrem letras, marcações parciais, títulos isolados, cifras 488/679, acordes/inversões/extensões, transposição −11/0/+11, alinhamento, busca, hidratação, falha de rede, deduplicação, invalidação, respostas antigas e persistência após edição.
- Exportação de produção para web: passou.
- Exportação do bundle Android/Hermes: passou. Isso não equivale a gerar ou testar um APK instalado.
- Navegador Edge com dimensões emuladas de 360×800, 412×915 e desktop 1280×900: catálogo, busca, leitura, cifra, troca de semitom, login e temas claro/escuro conferidos. Sem overflow horizontal da página nem exceções JavaScript não tratadas. A API local não estava disponível; as telas públicas usaram o conteúdo offline.

Para repetir as verificações com as dependências instaladas, na raiz do repositório:

```powershell
node node_modules/typescript/bin/tsc -p artifacts/hinario/tsconfig.json --noEmit
node --test artifacts/hinario/tests/contentCache.test.mjs artifacts/hinario/tests/cifras.test.cjs artifacts/hinario/tests/hinoSearch.test.mjs artifacts/hinario/tests/parseLetra.test.mjs
```

O pacote também expõe `pnpm --filter @workspace/hinario test`. Use a versão de pnpm indicada em `packageManager` no repositório. O pnpm 11 desta sessão tentou uma instalação automática ao detectar a mudança no manifesto; as verificações foram executadas diretamente com Node, sem alterar dependências ou lockfile.

## Tamanho do bundle e busca

No primeiro export desta implementação, os imports abrangentes incluíam fontes e ícones não usados. Após importar apenas as seis fontes e a família Feather necessárias:

| Medida da exportação web | Antes dos imports diretos | Depois |
| --- | ---: | ---: |
| Assets exportados | 70 | 26 |
| Arquivos de fonte | 51 | 7 |
| Bytes de fontes | 25.230.460 | 3.557.904 |
| JavaScript, sem compressão | 3.293.870 | 2.823.686 |

Isso representa redução de aproximadamente 86% nos bytes de fontes exportadas e 14% no JavaScript. São tamanhos de artefatos; não são uma medição do tempo de abertura no telefone.

Benchmark somente da lógica de busca, comparando o código anterior de `HEAD` com o novo código sobre os 684 hinos: Windows 10 x64, Ryzen 7 5700X, Node 24.22.1. Índice com 50 aquecimentos/300 amostras; cada busca com 500 aquecimentos/2.000 amostras. Tempos abaixo são p95 em milissegundos.

| Operação | Anterior | Atual |
| --- | ---: | ---: |
| Construir índice | 7,0421 | 6,0570 |
| Número 488 | 0,0889 | 0,1294 |
| Trecho “minha vitória” | 0,3671 | 0,3926 |
| Favoritos sem busca, 86 favoritos | 0,0415 | 0,0094 |
| Favoritos com “jesus” | 0,0432 | 0,0116 |

A filtragem de favoritos melhorou; as buscas gerais permaneceram próximas do código anterior. Esse benchmark não inclui renderização, rolagem, armazenamento ou rede.

## Validação restante em aparelho

Não havia Android/ADB disponível nesta sessão. As metas de busca em até 150 ms e conteúdo em cache visível em até 300 ms ainda precisam ser medidas no mesmo aparelho, em build de release, antes e depois da alteração. Registrar modelo, versão Android e resultados.

- Testar TalkBack, fonte do sistema ampliada e gestos de rolagem vertical/horizontal.
- Abrir o catálogo em modo avião e reabrir cifras previamente consultadas.
- Consultar uma cifra só remota, fechar/reabrir o app e verificar sua leitura offline.
- Testar internet lenta e atualização em segundo plano sem ocultar a cifra salva.
- Com uma API de teste, cadastrar/editar/excluir hinos; conferir a prévia, a atualização do catálogo e a persistência após desligar a rede.
- Conferir busca, filtro de favoritos e posição da lista ao voltar do leitor.

Não foram executadas mutações no banco de dados real durante a validação.
