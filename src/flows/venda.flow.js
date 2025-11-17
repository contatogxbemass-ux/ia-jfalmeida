const { sendText } = require("../services/zapi.service");
const { updateState } = require("../services/state.service");
const { iaResumo } = require("../services/openai.service");

module.exports = async function vendaFlow(telefone, msg, state) {
  switch (state.etapa) {
    case "venda_tipo":
      state.dados.tipo = msg;
      updateState(telefone, { etapa: "venda_local", dados: state.dados });
      return sendText(telefone, "Qual *bairro/região* do imóvel?");

    case "venda_local":
      state.dados.local = msg;
      updateState(telefone, { etapa: "venda_tamanho", dados: state.dados });
      return sendText(
        telefone,
        "Qual o *tamanho* do imóvel? (m² / número de quartos)"
      );

    case "venda_tamanho":
      state.dados.tamanho = msg;
      updateState(telefone, { etapa: "venda_estado", dados: state.dados });
      return sendText(
        telefone,
        "Qual o *estado de conservação*? (novo, reformado, precisa reforma...)"
      );

    case "venda_estado":
      state.dados.estado = msg;
      updateState(telefone, { etapa: "venda_valor", dados: state.dados });
      return sendText(telefone, "Qual o *valor desejado*?");

    case "venda_valor":
      state.dados.valor = msg;

      await sendText(telefone, "Gerando resumo para o corretor...");
      const resumo = await iaResumo("venda_imovel", state.dados, telefone);

      await sendText(telefone, resumo);
      await sendText(telefone, "Informações enviadas ao corretor!");

      updateState(telefone, { etapa: "aguardando_corretor", dados: {} });
      return;
  }
};
