/* Run on the account owner's computer. Authentication stays inside the official EAS CLI. */
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const crypto = require("node:crypto");
const { spawn } = require("node:child_process");
const { Readable } = require("node:stream");
const { pipeline } = require("node:stream/promises");
const readline = require("node:readline/promises");

const ROOT = path.resolve(__dirname, "..");
const APP = path.join(ROOT, "artifacts", "hinario");
const PROJECT = "59eca185-10bd-4706-93fe-f8de89079c65";
const IDENTIFIER = "com.miqueiasrezende1211cyber.hinario";
const EAS = "eas-cli@27.2.0";
const PNPM = "pnpm@10.34.4";
const STATE = path.join(APP, ".expo", "apk-build.json");
const API = "https://mapd-hinos.onrender.com";

function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }
function validateBuild(build) {
  if (!build || build.platform !== "ANDROID" || build.app?.id !== PROJECT ||
      build.appIdentifier !== IDENTIFIER || build.buildProfile !== "apk") {
    throw new Error("O Expo retornou uma compilacao diferente do projeto/perfil APK esperado. Nenhum arquivo foi baixado.");
  }
  if (!/^[a-f0-9-]{36}$/i.test(build.id)) throw new Error("Identificador de compilacao invalido.");
  return build;
}
function archiveUrl(build) {
  validateBuild(build);
  if (build.status !== "FINISHED") throw new Error(`Compilacao ainda nao concluida: ${build.status}`);
  const url = new URL(build.artifacts?.applicationArchiveUrl || build.artifacts?.buildUrl || "");
  if (url.protocol !== "https:") throw new Error("O Expo retornou um link de download inseguro.");
  return url.href;
}
function run(args, { capture = false, allowFailure = false } = {}) {
  // All shell arguments are fixed CLI flags, package names, or validated UUIDs.
  return new Promise((resolve, reject) => {
    const child = spawn("pnpm", args, {
      cwd: APP,
      shell: process.platform === "win32",
      env: { ...process.env, EAS_NO_VCS: "1", EAS_PROJECT_ROOT: ROOT },
      stdio: ["inherit", capture ? "pipe" : "inherit", "inherit"],
    });
    let output = "";
    if (capture) child.stdout.on("data", chunk => { output += chunk; });
    child.on("error", reject);
    child.on("close", code => {
      if (code === 0 || allowFailure) resolve({ code, output });
      else reject(new Error(`Comando terminou com codigo ${code}. Consulte a mensagem do Expo acima. Execute novamente para retomar.`));
    });
  });
}
const eas = (args, options) => run(["dlx", EAS, ...args], options);
function writeState(build) {
  fs.mkdirSync(path.dirname(STATE), { recursive: true });
  fs.writeFileSync(STATE, JSON.stringify({ buildId: build.id, projectId: PROJECT }, null, 2) + "\n");
}
async function download(build) {
  const url = archiveUrl(build);
  const downloads = path.join(os.homedir(), "Downloads");
  fs.mkdirSync(downloads, { recursive: true });
  const version = String(build.appVersion || "1.1.0").replace(/[^a-z0-9.-]/gi, "_");
  const versionCode = String(build.appBuildVersion || build.id.slice(0, 8)).replace(/[^a-z0-9.-]/gi, "_");
  const target = path.join(downloads, `MAPD-Hinario-${version}-${versionCode}.apk`);
  const partial = `${target}.part`;
  console.log("Baixando APK para:", target);
  const response = await fetch(url, { signal: AbortSignal.timeout(600_000) });
  if (!response.ok || !response.body) throw new Error(`Falha no download: HTTP ${response.status}`);
  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(partial));
  const fd = fs.openSync(partial, "r");
  const header = Buffer.alloc(4);
  fs.readSync(fd, header, 0, 4, 0);
  fs.closeSync(fd);
  if (!header.equals(Buffer.from([0x50, 0x4b, 0x03, 0x04])) || fs.statSync(partial).size < 100_000) {
    fs.unlinkSync(partial);
    throw new Error("O arquivo recebido nao tem o formato esperado de APK. Download descartado.");
  }
  fs.renameSync(partial, target);
  const hash = crypto.createHash("sha256");
  for await (const chunk of fs.createReadStream(target)) hash.update(chunk);
  const digest = hash.digest("hex");
  fs.writeFileSync(`${target}.sha256.txt`, `${digest}  ${path.basename(target)}\n`);
  console.log(`\nAPK PRONTO: ${target}\nTamanho: ${(fs.statSync(target).size / 1048576).toFixed(1)} MB\nSHA-256: ${digest}`);
  console.log("Envie o APK ao telefone e instale como atualizacao. O Android precisa reconhecer a mesma assinatura; nao desinstale a versao anterior se houver conflito.");
}
async function main() {
  const config = readJson(path.join(APP, "app.json")).expo;
  const profile = readJson(path.join(APP, "eas.json")).build.apk;
  if (config.extra?.eas?.projectId !== PROJECT || config.android?.package !== IDENTIFIER ||
      profile.channel !== "production" || profile.android?.buildType !== "apk") {
    throw new Error("A configuracao do projeto mudou. Confira app.json/eas.json antes de gerar o APK.");
  }
  if (process.argv.includes("--check")) {
    console.log("Configuracao local conferida. Nenhum login, build ou download foi iniciado.");
    return;
  }
  if (Number(process.versions.node.split(".")[0]) !== 24) {
    throw new Error("Instale Node.js 24 e pnpm 10.34.4 antes de continuar (instrucoes no LEIA-ME).");
  }
  await run(["--version"]);
  if (!fs.existsSync(path.join(APP, "node_modules", "expo-updates"))) {
    console.log("Instalando dependencias locais com a versao de pnpm do projeto...");
    await run(["dlx", PNPM, "install", "--frozen-lockfile"]);
  }
  const session = await eas(["whoami"], { capture: true, allowFailure: true });
  if (session.code !== 0 || /not logged in/i.test(session.output)) {
    console.log("Autorize o login na conta do proprietario do Hinario no navegador. Nao envie sua senha a outra pessoa.");
    await eas(["login", "--device"]);
  } else console.log(session.output.trim());

  let build;
  if (fs.existsSync(STATE) && !process.argv.includes("--new")) {
    const state = readJson(STATE);
    if (state.projectId !== PROJECT || !/^[a-f0-9-]{36}$/i.test(state.buildId)) throw new Error("Arquivo de retomada invalido.");
    console.log(`Retomando a compilacao ${state.buildId}. Para compilar alteracoes posteriores use --new.`);
    build = validateBuild(JSON.parse((await eas(["build:view", state.buildId, "--json"], { capture: true })).output));
  } else {
    const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
    let answer;
    try {
      answer = await prompt.question("\nConfira no painel Expo > projeto Hinario > Credentials > Android se a configuracao padrao usa a chave ORIGINAL do APK instalado. O EAS pode criar outra chave se ela estiver ausente. Digite CONFIRMADO somente depois de conferir (Enter cancela): ");
    } finally { prompt.close(); }
    if (answer.trim() !== "CONFIRMADO") throw new Error("Compilacao nao iniciada. O proprietario precisa confirmar a chave Android original.");
    // Only this public variable is changed; no token/credential is written by this helper.
    await eas(["env:set", "production", "--name", "EXPO_PUBLIC_API_URL", "--value", API, "--visibility", "plaintext", "--type", "string", "--scope", "project", "--non-interactive"]);
    console.log("Iniciando o build APK com a configuracao de assinatura conferida pelo proprietario...");
    const output = await eas(["build", "--platform", "android", "--profile", "apk", "--freeze-credentials", "--non-interactive", "--no-wait", "--json"], { capture: true });
    const builds = JSON.parse(output.output);
    if (!Array.isArray(builds) || builds.length !== 1) throw new Error("Resposta de build inesperada. Consulte o painel Expo antes de iniciar outra compilacao.");
    build = validateBuild(builds[0]);
    writeState(build);
  }
  console.log(`Compilacao: ${build.id}\nSe esta janela fechar, execute o mesmo arquivo para retomar.`);
  for (;;) {
    console.log(`${new Date().toLocaleTimeString()} - ${build.status}`);
    if (build.status === "FINISHED") return download(build);
    if (["ERRORED", "CANCELED", "PENDING_CANCEL"].includes(build.status)) {
      throw new Error(`A compilacao terminou em ${build.status}. Consulte os logs no painel Expo. Apos corrigir, execute com --new.`);
    }
    await new Promise(resolve => setTimeout(resolve, 30_000));
    build = validateBuild(JSON.parse((await eas(["build:view", build.id, "--json"], { capture: true })).output));
  }
}

module.exports = { validateBuild, archiveUrl };
if (require.main === module) main().catch(error => {
  console.error(`\nNao foi possivel concluir: ${error.message}\nOs arquivos de origem permanecem preparados. Consulte docs/continuar-apk.md.`);
  process.exitCode = 1;
});
