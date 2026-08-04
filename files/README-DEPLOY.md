# Como publicar — Escolinha Nova Geração

Este guia coloca o painel administrativo, a assinatura digital de contrato e
o "banco de dados" (arquivo `data/alunos.json` no GitHub) no ar, usando
GitHub + Netlify. Não precisa contratar hospedagem nem banco de dados
separado — o GitHub guarda os dados e o Netlify serve o site e roda as
funções que falam com o GitHub com segurança.

## Como funciona (resumo)

- `admin.html` — painel da coordenação (login por senha).
- `contrato.html` — página pública que o responsável abre pelo link do WhatsApp para assinar o contrato.
- `data/alunos.json` — o "banco de dados": um arquivo no próprio repositório do GitHub com a lista de alunos.
- `netlify/functions/alunos.js` — só o painel usa; lê/grava a lista inteira de alunos no GitHub (exige senha).
- `netlify/functions/contrato.js` — a página pública usa; lê os dados de UM aluno e registra a assinatura (sem senha, mas só mexe no aluno certo).

O token de acesso do GitHub **nunca fica no navegador** — ele mora só nas
variáveis de ambiente do Netlify, e as duas funções acima é que conversam
com o GitHub por trás dos panos.

## Passo 1 — Subir os arquivos para o GitHub

No repositório que já existe (`wsms2ste/nova-geracao-fc`), adicione/substitua:

```
admin.html                     (substitui o admin.html atual)
contrato.html                  (novo)
netlify.toml                   (novo)
netlify/functions/_lib.js      (novo)
netlify/functions/alunos.js    (novo)
netlify/functions/contrato.js  (novo)
data/alunos.json               (novo — pode ficar como está, "[]")
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
2. Em configurações de build: **Build command** vazio, **Publish directory**: `.` (o `netlify.toml` já cuida do resto).
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
| `ADMIN_TOKEN` | a mesma senha definida em `SENHA_PAINEL` dentro do `admin.html` |

Depois de salvar as variáveis, faça um novo deploy (**Deploys → Trigger
deploy**) para elas passarem a valer.

> **Importante:** troque a senha padrão `1234` tanto no `admin.html`
> (`SENHA_PAINEL`) quanto na variável `ADMIN_TOKEN` — as duas precisam ser
> **idênticas**, senão o painel não consegue salvar.

## Passo 5 — Testar

1. Abra `https://SEU-SITE.netlify.app/admin.html`, entre com a senha.
2. Cadastre um aluno de teste e confira se o arquivo `data/alunos.json`
   no GitHub foi atualizado (aparece um novo commit automático).
3. Clique em **Contrato** na linha do aluno — abre o WhatsApp com o link
   de `contrato.html?id=...`.
4. Abra esse link (pode ser no seu celular) e assine o contrato de teste.
5. Volte ao painel e recarregue — o aluno deve aparecer com "✔ Contrato assinado".

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
abrir o painel novo, o sistema detecta que o GitHub está vazio e envia
automaticamente os dados salvos naquele aparelho para o GitHub — não é
preciso recadastrar ninguém. Isso só acontece uma vez, na primeira pessoa
que abrir o painel novo depois da publicação.
