const { sendText } = require("../services/zapi.service");
const { updateSession } = require("../services/redis.service");
const { gerarResumoIA } = require("../services/openai.service");

module.exports = async function vendaFlow(telefone, msg, state) {
  state.dados = state.dados || {};
  state.fluxo = "venda_imovel";
  state.telefone = telefone;

  switch (state.etapa) {
    case "venda_tipo":
      state.dados.tipo = msg;
      await updateSession(telefone, { etapa: "venda_local", dados: state.dados, fluxo: state.fluxo });
      return sendText(telefone, "Qual *bairro/região* do imóvel?");

    case "venda_local":
      state.dados.local = msg;
      await updateSession(telefone, { etapa: "venda_tamanho", dados: state.dados, fluxo: state.fluxo });
      return sendText(telefone, "Qual o *tamanho* do imóvel?");

    case "venda_tamanho":
      state.dados.tamanho = msg;
      await updateSession(telefone, { etapa: "venda_estado", dados: state.dados, fluxo: state.fluxo });
      return sendText(telefone, "Qual o *estado de conservação*?");

    case "venda_estado":
      state.dados.estado = msg;
      await updateSession(telefone, { etapa: "venda_valor", dados: state.dados, fluxo: state.fluxo });
      return sendText(telefone, "Qual o *valor desejado*?");

    case "venda_valor":
      state.dados.valor = msg;

      await sendText(telefone, "Gerando resumo para o corretor...");

      const resumo = await gerarResumoIA("venda_imovel", state);
      await sendText(telefone, resumo);
      await sendText(telefone, "Informações enviadas ao corretor!");

      await updateSession(telefone, { etapa: "aguardando_corretor", dados: {} });
  }
};
