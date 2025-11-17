const { updateSession } = require("../services/redis.service");
const { sendText } = require("../services/zapi.service");
const { gerarResumoIA } = require("../services/openai.service");

module.exports = async function listFlow(telefone, msg, state) {
  state.dados = state.dados || {};

  if (state.etapa === "list_tipo") {
    state.dados.tipo = msg;
    await updateSession(telefone, {
      etapa: "list_regiao",
      dados: state.dados,
    });
    return sendText(telefone, "Bairro/região desejada?");
  }

  if (state.etapa === "list_regiao") {
    state.dados.regiao = msg;
    await updateSession(telefone, {
      etapa: "list_preco",
      dados: state.dados,
    });
    return sendText(telefone, "Preço máximo?");
  }

  if (state.etapa === "list_preco") {
    state.dados.preco = msg;
    await updateSession(telefone, {
      etapa: "list_quartos",
      dados: state.dados,
    });
    return sendText(telefone, "Quantos quartos?");
  }

  if (state.etapa === "list_quartos") {
    state.dados.quartos = msg;
    await updateSession(telefone, {
      etapa: "list_finalidade",
      dados: state.dados,
    });
    return sendText(telefone, "Finalidade? (moradia/investimento)");
  }

  if (state.etapa === "list_finalidade") {
    state.dados.finalidade = msg;

    const resumo = await gerarResumoIA(
      "listagem_imoveis",
      state.dados,
      telefone
    );
    await sendText(telefone, resumo);
    await sendText(telefone, "Encaminhei ao corretor!");

    await updateSession(telefone, { etapa: "aguardando_corretor", dados: {} });
    return;
  }
};
