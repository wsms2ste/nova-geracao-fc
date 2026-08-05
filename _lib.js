// Funções auxiliares para ler e gravar dados no repositório do GitHub,
// usando a Contents API. O token do GitHub fica só aqui no servidor
// (variável de ambiente), nunca é enviado para o navegador.

const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const TOKEN = process.env.GITHUB_TOKEN;
const DATA_PATH = process.env.DATA_PATH || 'data/alunos.json';

function checarConfiguracao(){
  const faltando = [];
  if (!OWNER) faltando.push('GITHUB_OWNER');
  if (!REPO) faltando.push('GITHUB_REPO');
  if (!TOKEN) faltando.push('GITHUB_TOKEN');
  if (faltando.length){
    throw new Error('Variáveis de ambiente não configuradas no Netlify: ' + faltando.join(', '));
  }
}

function githubHeaders(){
  return {
    Authorization: `Bearer ${TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

// Busca o arquivo JSON no GitHub. Retorna { data, sha }.
// Se o arquivo ainda não existir, retorna { data: [], sha: null } sem erro
// (assim o primeiro salvamento cria o arquivo automaticamente).
async function githubGetFile(path){
  checarConfiguracao();
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${encodeURIComponent(BRANCH)}`;
  const resp = await fetch(url, { headers: githubHeaders() });

  if (resp.status === 404){
    return { data: [], sha: null };
  }
  if (!resp.ok){
    const texto = await resp.text();
    throw new Error(`Erro ao ler ${path} no GitHub (status ${resp.status}): ${texto}`);
  }

  const json = await resp.json();
  const conteudo = Buffer.from(json.content, 'base64').toString('utf-8');
  let data;
  try {
    data = conteudo.trim() ? JSON.parse(conteudo) : [];
  } catch (err) {
    throw new Error(`O arquivo ${path} no GitHub não é um JSON válido.`);
  }
  return { data, sha: json.sha };
}

// Grava o objeto/array como JSON no GitHub. Passe o "sha" retornado por
// githubGetFile quando o arquivo já existir (evita sobrescrever alterações
// feitas por outra pessoa da equipe ao mesmo tempo).
async function githubPutFile(path, dataObj, mensagem, sha){
  checarConfiguracao();
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`;
  const body = {
    message: mensagem,
    content: Buffer.from(JSON.stringify(dataObj, null, 2), 'utf-8').toString('base64'),
    branch: BRANCH,
  };
  if (sha) body.sha = sha;

  const resp = await fetch(url, {
    method: 'PUT',
    headers: { ...githubHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!resp.ok){
    const texto = await resp.text();
    throw new Error(`Erro ao salvar ${path} no GitHub (status ${resp.status}): ${texto}`);
  }
  return resp.json();
}

module.exports = { githubGetFile, githubPutFile, DATA_PATH };
