# Atualizações do APK pelo Expo

O APK precisa incluir `expo-updates`, a URL do projeto EAS e o canal `production`. Uma instalação inicial desse APK é necessária; depois, atualizações JavaScript e assets compatíveis chegam pela internet.

## Configuração usada

- Projeto: `59eca185-10bd-4706-93fe-f8de89079c65`.
- Canal: `production`; ambiente EAS: `production`.
- Runtime: política `fingerprint`. Mudanças que afetem o runtime nativo produzem outra identificação e exigem novo APK, impedindo que uma atualização incompatível seja carregada.
- Verificação de atualizações: `ON_LOAD`, sem espera extra (`fallbackToCacheTimeout: 0`). A versão salva abre imediatamente, uma atualização compatível é baixada em segundo plano e passa a valer na próxima inicialização completa.
- API pública: `https://mapd-hinos.onrender.com`.

## Publicação automática

O workflow `.github/workflows/hinario-update.yml` verifica tipos/testes e publica uma atualização Android quando alterações do app chegam à branch `main`. Também permite execução manual pela aba Actions, limitada à `main`.

Antes da primeira execução, a conta Expo responsável pelo projeto precisa fornecer um token no segredo de repositório `EXPO_TOKEN`. Não salve esse token no código, em arquivos `.env` versionados nem em mensagens de chat.

O ambiente `production` no EAS deve conter `EXPO_PUBLIC_API_URL=https://mapd-hinos.onrender.com` com visibilidade plaintext. Essa URL é pública. Variáveis `env` de perfis em `eas.json` se aplicam ao build, mas não substituem a configuração usada por `eas update --environment production`.

Publicação manual, executada em `artifacts/hinario` com EAS CLI autenticado:

```sh
eas update --channel production --platform android --environment production --message "Descrição da atualização" --non-interactive
```

## Instalação e validação inicial

1. Gerar o APK com o perfil `apk`, mantendo a assinatura remota já usada pelo projeto e incrementando o versionCode.
2. Instalar por cima do app existente, sem desinstalar, quando o Android reconhecer a mesma assinatura/identificador.
3. Publicar uma alteração compatível identificável e abrir o app com internet para baixá-la.
4. Encerrar completamente e reabrir o app para confirmar a alteração. Testar também abertura sem internet.

A presença do workflow no disco não comprova automação ativa: ele precisa estar no GitHub, com `EXPO_TOKEN` disponível, e a execução deve concluir com sucesso. A entrega de um APK com suporte a updates não cria esse segredo nem configura as credenciais do GitHub.

Referências: [Configuração EAS Update](https://docs.expo.dev/eas-update/getting-started/), [GitHub Actions](https://docs.expo.dev/eas-update/github-actions/), [Compatibilidade por runtime](https://docs.expo.dev/eas-update/runtime-versions/), [Ambientes EAS](https://docs.expo.dev/eas/environment-variables/).
