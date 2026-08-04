// Endpoint público (sem senha) usado pela página contrato.html.
// GET  -> devolve só os dados necessários para mostrar o contrato de UM
//         aluno (nunca a lista inteira, nunca o telefone de outra família).
// POST -> registra a assinatura digital daquele aluno.

const { githubGetFile, githubPutFile, DATA_PATH } = require('./_lib');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function dadosPublicos(aluno){
  return {
    id: aluno.id,
    nome: aluno.nome,
    responsavel: aluno.responsavel,
    unidade: aluno.unidade,
    valor: aluno.valor,
    dataInicio: aluno.dataInicio,
    vencimento: aluno.vencimento,
    contratoAssinado: Boolean(aluno.contratoAssinado),
    assinatura: aluno.assinatura || null,
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS'){
    return { statusCode: 204, headers: CORS, body: '' };
  }

  try {
    if (event.httpMethod === 'GET'){
      const id = event.queryStringParameters && event.queryStringParameters.id;
      if (!id){
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ erro: 'ID do aluno não informado.' }) };
      }
      const { data } = await githubGetFile(DATA_PATH);
      const aluno = (data || []).find(a => a.id === id);
      if (!aluno){
        return { statusCode: 404, headers: CORS, body: JSON.stringify({ erro: 'Cadastro não encontrado.' }) };
      }
      return { statusCode: 200, headers: CORS, body: JSON.stringify(dadosPublicos(aluno)) };
    }

    if (event.httpMethod === 'POST'){
      let corpo;
      try {
        corpo = JSON.parse(event.body || '{}');
      } catch (err) {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ erro: 'Corpo da requisição inválido.' }) };
      }
      const { id, nomeAssinante, cpf } = corpo;
      if (!id){
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ erro: 'ID do aluno não informado.' }) };
      }
      if (!nomeAssinante || nomeAssinante.trim().length < 5){
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ erro: 'Informe o nome completo do responsável.' }) };
      }

      const { data, sha } = await githubGetFile(DATA_PATH);
      const lista = data || [];
      const idx = lista.findIndex(a => a.id === id);
      if (idx === -1){
        return { statusCode: 404, headers: CORS, body: JSON.stringify({ erro: 'Cadastro não encontrado.' }) };
      }
      if (lista[idx].contratoAssinado){
        return {
          statusCode: 409,
          headers: CORS,
          body: JSON.stringify({ erro: 'Este contrato já foi assinado.', assinatura: lista[idx].assinatura }),
        };
      }

      const agora = new Date();
      const assinatura = {
        nome: nomeAssinante.trim(),
        cpf: (cpf || '').trim(),
        dataHora: agora.toISOString(),
      };

      lista[idx].contratoAssinado = true;
      lista[idx].assinatura = assinatura;
      if (!Array.isArray(lista[idx].historico)) lista[idx].historico = [];
      lista[idx].historico.unshift({
        data: agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        texto: `Contrato assinado digitalmente por ${assinatura.nome}.`,
      });

      await githubPutFile(DATA_PATH, lista, `Contrato assinado - ${lista[idx].nome}`, sha);
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, assinatura }) };
    }

    return { statusCode: 405, headers: CORS, body: JSON.stringify({ erro: 'Método não permitido.' }) };
  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ erro: err.message }) };
  }
};
