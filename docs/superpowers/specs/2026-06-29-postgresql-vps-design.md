# PostgreSQL público na VPS — Design

## Objetivo

Provisionar na VPS acessada pelo host SSH `wanvex-backend` um PostgreSQL
dedicado ao MAPD Hinos, restaurar o conteúdo de `db-export` e configurar o
projeto atual para usar a nova instância por meio de `DATABASE_URL`.

## Arquitetura

O banco rodará em um contêiner `postgres:16-alpine` separado dos serviços
Wanvex e Xerife. A instância terá contêiner, volume, usuário, banco e diretório
de implantação próprios, sem compartilhar redes ou volumes com as stacks
existentes.

A porta TCP 5432 da VPS será publicada para qualquer endereço de origem,
conforme solicitado para permitir o acesso de um serviço terceiro sem IP fixo.
O PostgreSQL exigirá TLS para conexões remotas e usará autenticação SCRAM-SHA-256
com uma senha aleatória forte. A URL entregue usará o hostname público
`vpsxerife.vps-kinghost.net`, com `sslmode=require`.

## Componentes

- `db-export/docker-compose.yml`: definição do serviço, volume persistente,
  healthcheck, publicação da porta e montagem dos arquivos de inicialização e
  TLS.
- `db-export/schema.sql`: criação da extensão, enum e tabelas da aplicação.
- `db-export/data.sql`: restauração dos 687 hinos, 9 cifras e 1 usuário.
- Arquivos de configuração PostgreSQL em `db-export`: ativação de TLS,
  SCRAM-SHA-256 e regra de acesso remoto somente com SSL.
- `db-export/.env` na VPS: senha real, com permissão restrita e fora do Git.
- `.env` local do projeto: `DATABASE_URL` real, também fora do Git.
- `.env.example` e documentação: formato seguro da conexão, sem credenciais
  reais.

## Fluxo de implantação

1. Gerar localmente uma senha URL-safe criptograficamente aleatória.
2. Gerar certificado e chave TLS dedicados ao serviço.
3. Copiar `db-export` para um diretório exclusivo em `/home/deploy` na VPS.
4. Criar o arquivo secreto da implantação e subir o Compose.
5. Aguardar o healthcheck e validar a restauração.
6. Testar uma conexão TLS pela interface pública da VPS.
7. Gravar a URL funcional no `.env` local e manter somente placeholders nos
   arquivos versionados.

## Segurança

O banco ficará deliberadamente acessível pela internet a qualquer IP. Para
reduzir o risco:

- conexões remotas sem TLS serão recusadas;
- senhas serão armazenadas com SCRAM-SHA-256;
- será usada uma credencial exclusiva, longa e aleatória;
- nenhum segredo será registrado no Git ou exibido em logs de comandos;
- o contêiner não terá privilégios adicionais nem acesso às stacks existentes;
- a URL pública será entregue diretamente ao usuário ao final.

`sslmode=require` cifra o transporte, mas não valida a identidade do servidor
como faria `verify-full` com uma autoridade certificadora confiável. Essa é uma
limitação aceita nesta primeira implantação. Quando o serviço terceiro tiver IP
fixo, o acesso deverá ser restringido no firewall.

## Tratamento de falhas e reversão

Se a porta 5432 estiver indisponível ou bloqueada externamente, a publicação
será movida para uma porta TCP dedicada e a URL será atualizada. Se a
inicialização SQL falhar, os logs serão inspecionados e somente o volume novo e
exclusivo do MAPD Hinos será recriado; nenhum volume Wanvex/Xerife será tocado.

Parar o Compose remove a exposição do serviço sem apagar os dados. A remoção do
volume exigirá uma ação separada e explícita.

## Validação

A implantação será considerada concluída somente quando:

- o healthcheck do contêiner estiver saudável;
- uma consulta externa com TLS obrigatório retornar PostgreSQL 16;
- `hinos`, `cifras` e `usuarios` tiverem respectivamente 687, 9 e 1 registros;
- uma tentativa de conexão sem TLS for recusada;
- o projeto passar pela verificação de tipos usando a nova configuração;
- a `DATABASE_URL` entregue conectar com sucesso a partir de fora da VPS.

