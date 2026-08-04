// Endpoint usado só pelo painel administrativo (admin.html).
// Exige o cabeçalho x-admin-token igual à variável de ambiente ADMIN_TOKEN,
// por isso é seguro guardar aqui os dados completos dos alunos (telefone,
// valores, histórico etc.) sem expor para qualquer pessoa com o link.

const { githubGetFile, githubPutFile, DATA_PATH } = require('./_lib');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-admin-token',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
};

function autenticado(event){
  const token = event.headers['x-admin-token'] || event.headers['X-Admin-Token'];
  return Boolean(token) && Boolean(process.env.ADMIN_TOKEN) && token === process.env.ADMIN_TOKEN;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS'){
    return { statusCode: 204, headers: CORS, body: '' };
  }

  if (!autenticado(event)){
    return { statusCode: 401, headers: CORS, body: JSON.stringify({ erro: 'Token de administrador inválido ou ausente.' }) };
  }

  try {
    if (event.httpMethod === 'GET'){
      const { data } = await githubGetFile(DATA_PATH);
      return { statusCode: 200, headers: CORS, body: JSON.stringify(data) };
    }

    if (event.httpMethod === 'PUT'){
      let novaLista;
      try {
        novaLista = JSON.parse(event.body || '[]');
      } catch (err) {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ erro: 'Corpo da requisição não é um JSON válido.' }) };
      }
      if (!Array.isArray(novaLista)){
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ erro: 'Esperava uma lista de alunos.' }) };
      }

      const { sha } = await githubGetFile(DATA_PATH);
      await githubPutFile(DATA_PATH, novaLista, 'Atualização de alunos via painel administrativo', sha);
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, headers: CORS, body: JSON.stringify({ erro: 'Método não permitido.' }) };
  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ erro: err.message }) };
  }
};
