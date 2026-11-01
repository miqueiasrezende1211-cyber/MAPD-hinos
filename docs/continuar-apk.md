# Continuar a geração do APK

O projeto está preparado para gerar o APK 1.1.0, com o novo visual, melhorias de desempenho, cache offline e suporte EAS Update. Ainda não há APK gerado nem automação de publicação confirmada.

## O que o proprietário da conta precisa fazer

1. Em um computador, extraia o pacote completo e abra `GERAR-APK.cmd`. No projeto original, ele fica na raiz de `MAPD-hinos`.
2. Se solicitado, abra o link e informe o código de dispositivo exibido pelo login oficial do Expo, no navegador do computador ou do telefone. Use a conta que tem acesso ao projeto Expo `59eca185-10bd-4706-93fe-f8de89079c65`. Não é necessário compartilhar senha ou token com o Mateus.
3. Confira no painel Expo → projeto Hinário → Credentials → Android que a configuração padrão usa a chave original do APK instalado. O roteiro pedirá `CONFIRMADO` antes do primeiro build. Se não conseguir verificar, cancele e resolva as credenciais primeiro.
4. Deixe a janela aberta. O roteiro instala dependências ausentes, configura somente a URL pública da API em `production`, inicia o build, acompanha a fila e baixa o APK na pasta Downloads do usuário.
5. Se a janela fechar ou a conexão cair, execute o mesmo arquivo para retomar. O ID é salvo em `artifacts/hinario/.expo/apk-build.json`. Para uma nova compilação após alterações posteriores, execute `node scripts/gerar-apk.cjs --new`.

O resultado terá o nome `MAPD-Hinario-1.1.0-<versionCode>.apk`, acompanhado do SHA-256. A conferência de download verifica o status/projeto/perfil no Expo e o formato ZIP do arquivo; o Android verifica a assinatura durante a instalação.

Se o Expo informar falta de assinatura/permissão, o dono da conta deve conferir as credenciais existentes no painel EAS. Embora o comando use `--freeze-credentials`, essa opção não bloqueia todos os caminhos de criação de chave Android no EAS CLI 27.2.0. Por isso a confirmação da chave original é necessária. Não substitua a chave por uma nova para tentar resolver uma falha de permissão.

## Em outro computador

Instale Node.js 24 (https://nodejs.org/) e pnpm 10.34.4. Com Node/npm disponíveis, o pnpm pode ser instalado com `npm install -g pnpm@10.34.4`. Extraia toda a pasta antes de abrir o comando; executar de dentro do ZIP não funciona. No macOS/Linux, use `node scripts/gerar-apk.cjs` na raiz do projeto. É necessária conexão com a internet.

O pacote não contém `node_modules`, credenciais de conta, chaves de assinatura, `.git`, arquivos `.env` ou exportações do banco. O modo sem Git usa `EAS_NO_VCS=1` e `EAS_PROJECT_ROOT` para enviar a raiz completa do monorepo ao EAS.

## Somente pelo telefone

O Expo Go não compila um APK nem configura segredos do GitHub. O dono da conta pode autorizar o login pelo navegador do telefone enquanto o comando roda no computador. Para executar tudo sem esse computador, ele precisará usar outro computador ou preparar a integração GitHub/EAS na web.

Há uma alternativa no site Expo: **Builds → Build from GitHub**, selecionando a branch atual, Android e o perfil `apk`. Para este monorepo, o diretório base é `artifacts/hinario`. Essa alternativa exige que a integração GitHub esteja autorizada, o código esteja publicado, `build.apk.android.image` esteja definido no `eas.json` (a documentação sugere `latest`) e já exista um build Android bem-sucedido iniciado por computador. Essas condições não foram verificadas na conta do proprietário. Não basta abrir o Expo Go. Consulte a [documentação oficial de builds pelo GitHub](https://docs.expo.dev/build/building-from-github/).

## Ativar as próximas publicações automáticas

O APK já será associado ao canal `production`. Para a publicação automática após mudanças no código, falta:

1. Conferir se a branch `main` do repositório `miqueiasrezende1211-cyber/MAPD-hinos` contém a configuração atual e o workflow `.github/workflows/hinario-update.yml`. Enviar as alterações locais que faltarem.
2. O dono da conta Expo criar um token e adicioná-lo diretamente ao segredo `EXPO_TOKEN` desse repositório, em Settings → Secrets and variables → Actions. Não enviar o token em mensagens nem colocá-lo no código.
3. Conferir que o ambiente EAS `production` possui `EXPO_PUBLIC_API_URL=https://mapd-hinos.onrender.com` (o roteiro de geração configura essa variável pública).
4. Executar o workflow “Publicar atualização do Hinário” e confirmar sucesso.

Após instalar o primeiro APK com este suporte, updates JavaScript/assets compatíveis são baixados em segundo plano e aplicados na próxima inicialização completa. Alterações nativas ainda exigem novo APK. O workflow está preparado; não foi possível confirmar credenciais ou execução bem-sucedida na conta do amigo.
