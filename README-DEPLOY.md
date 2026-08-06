# Como publicar — Escolinha Nova Geração

Este guia coloca o site, os dois painéis administrativos, a assinatura digital
de contrato e o "banco de dados" (arquivo `data/alunos.json` no GitHub) no
ar, usando GitHub + Netlify. Não precisa contratar hospedagem nem banco de
dados separado — o GitHub guarda os dados e o Netlify serve o site e roda as
funções que falam com o GitHub com segurança.

## Estrutura de pastas

```
public/                      <- tudo que fica público no site
  index.html                    a página que os visitantes veem
  admin.html                    painel de conteúdo do site (preços, WhatsApp, transmissão, unidades, ofertas)
  painel.html                   painel de alunos e contratos (cadastro, cobrança, assinatura)
  contrato.html                 página pública que o responsável abre para assinar o contrato
  config.js                     textos, preços e links editados pelo admin.html
  assets/                       imagens (logo, fotos dos produtos)

netlify/functions/           <- funções que só rodam no servidor (nunca no navegador)
  _lib.js                       funções auxiliares para ler/gravar no GitHub
  alunos.js                     usada só pelo painel.html (exige senha)
  contrato.js                   usada pelo contrato.html (pública, mas só mexe no aluno certo)

data/
  alunos.json                   o "banco de dados": lista de alunos, guardada no próprio repositório

netlify.toml                 <- diz ao Netlify para publicar a pasta public/ (não a raiz)
```

**Importante:** `data/alunos.json` guarda telefone, valores e outros dados
dos alunos, por isso ele fica FORA da pasta `public/` — assim ele nunca é
servido diretamente pelo navegador, só as funções do Netlify conseguem lê-lo
(e olhe lá, com senha no caso do painel.html).

### Os dois painéis não são a mesma coisa

- **admin.html** — edita o conteúdo do site (preços da loja, WhatsApp,
  Instagram, link de transmissão, jogos, unidades, ofertas). Não depende do
  GitHub/Netlify: salva no navegador e gera um `config.js` novo para você
  baixar e subir no lugar do antigo. Senha própria, guardada como hash
  dentro do `config.js` (campo `adminPasswordHash`).
- **painel.html** — gerencia o cadastro dos alunos e os contratos (adicionar
  aluno, marcar pagamento, enviar contrato pelo WhatsApp, ver quem já
  assinou). Esse sim depende do GitHub/Netlify: cada alteração é salva
  direto em `data/alunos.json` no repositório, para toda a equipe ver.
  Senha própria (`SENHA_PAINEL`, dentro do próprio `painel.html`), que
  precisa ser **idêntica** à variável `ADMIN_TOKEN` do Netlify.

## Passo 1 — Subir os arquivos para o GitHub

No repositório que já existe (`wsms2ste/nova-geracao-fc`), suba tudo
mantendo exatamente esta estrutura de pastas (substitua os arquivos antigos
que estavam soltos na raiz):

```
public/index.html
public/admin.html
public/painel.html
public/contrato.html
public/config.js
public/assets/                 (as imagens que já estavam no repositório)
netlify/functions/_lib.js
netlify/functions/alunos.js
netlify/functions/contrato.js
data/alunos.json               (pode ficar como está, "[]", se ainda não tiver alunos)
netlify.toml
```

Pode subir pelo site do GitHub mesmo (botão "Add file" → "Upload files"),
arrastando as pastas/arquivos, ou por linha de comando (`git add`, `git
commit`, `git push`) se preferir.

## Passo 2 — Criar um token de acesso do GitHub

1. No GitHub, vá em **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. Em **Repository access**, escolha "Only select repositories" e marque `nova-geracao-fc`.
3. Em **Permissions → Repository permissions**, defina **Contents: Read and write**.
4. Gere o token e copie o valor (só aparece uma vez — guarde em lugar seguro).

## Passo 3 — Criar o site no Netlify

1. Em [app.netlify.com](https://app.netlify.com), **Add new site → Import an existing project → GitHub**, e selecione o repositório `wsms2ste/nova-geracao-fc`.
2. Em configurações de build: **Build command** vazio, **Publish directory**: `public` (o `netlify.toml` já cuida disso, mas confira).
3. Deploy.

## Passo 4 — Configurar as variáveis de ambiente

No Netlify: **Site settings → Environment variables**, adicione:

| Variável | Valor |
|---|---|
| `GITHUB_TOKEN` | o token gerado no Passo 2 |
| `GITHUB_OWNER` | `wsms2ste` |
| `GITHUB_REPO` | `nova-geracao-fc` |
| `GITHUB_BRANCH` | `main` |
| `DATA_PATH` | `data/alunos.json` |
| `ADMIN_TOKEN` | a mesma senha definida em `SENHA_PAINEL` dentro do `painel.html` |

Depois de salvar as variáveis, faça um novo deploy (**Deploys → Trigger
deploy**) para elas passarem a valer.

> **Importante:** troque a senha padrão `1234` no `painel.html`
> (`SENHA_PAINEL`) e na variável `ADMIN_TOKEN` — as duas precisam ser
> **idênticas**, senão o painel.html não consegue salvar. Isso é
> independente da senha do `admin.html` (essa é local, trocada pelo
> próprio painel de conteúdo, seção Segurança).

## Passo 5 — Testar

1. Abra `https://SEU-SITE.netlify.app/painel.html`, entre com a senha.
2. Cadastre um aluno de teste e confira se o arquivo `data/alunos.json`
   no GitHub foi atualizado (aparece um novo commit automático).
3. Clique em **Contrato** na linha do aluno — abre o WhatsApp com o link
   de `contrato.html?id=...`.
4. Abra esse link (pode ser no seu celular) e assine o contrato de teste.
5. Volte ao painel e recarregue — o aluno deve aparecer com "✔ Contrato assinado".
6. Abra `https://SEU-SITE.netlify.app/admin.html` e confira que o painel de
   conteúdo do site (preços, WhatsApp etc.) continua funcionando normalmente.

## Sobre o texto do contrato

O texto que aparece em `contrato.html` é um **modelo padrão** (prestação
de serviço, mensalidade, cancelamento, uso de imagem, etc.), pensado para
uma escolinha de futebol — mas não substitui uma revisão jurídica. Se a
escolinha já tem um contrato próprio (Word/PDF), me envie o texto que eu
troco pelo conteúdo real diretamente na função `montarTextoContrato()` do
`contrato.html`.

## Sobre a migração dos alunos já cadastrados

Se o painel antigo (só localStorage) já tinha alunos cadastrados no
celular/computador de alguém da equipe, a primeira vez que essa pessoa
abrir o `painel.html` novo, o sistema detecta que o GitHub está vazio e
envia automaticamente os dados salvos naquele aparelho para o GitHub — não
é preciso recadastrar ninguém. Isso só acontece uma vez, na primeira pessoa
que abrir o painel novo depois da publicação.
