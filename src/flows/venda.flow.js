const { sendMessage } = require("../services/zapi.service");
const { updateState } = require("../services/state.service");
const { iaResumo } = require("../services/openai.service");

module.exports = async function vendaFlow(telefone, msg, state) {
  switch (state.etapa) {
    case "venda_tipo":
      state.dados.tipo = msg;
      updateState(telefone, {
        etapa: "venda_local",
        dados: state.dados,
      });
      await sendMessage(telefone, "Em qual *bairro/região* fica o imóvel?");
      return;

    case "venda_local":
      state.dados.local = msg;
      updateState(telefone, {
        etapa: "venda_tamanho",
        dados: state.dados,
      });
      await sendMessage(
        telefone,
        "Qual o *tamanho ou número de quartos* do imóvel?"
      );
      return;

    case "venda_tamanho":
      state.dados.tamanho = msg;
      updateState(telefone, {
        etapa: "venda_estado",
        dados: state.dados,
      });
      await sendMessage(
        telefone,
        "Como está o *estado de conservação*? (novo, reformado, precisa de reforma...)"
      );
      return;

    case "venda_estado":
      state.dados.estado = msg;
      updateState(telefone, {
        etapa: "venda_valor",
        dados: state.dados,
      });
      await sendMessage(telefone, "Qual é o *valor de venda desejado*?");
      return;

    case "venda_valor":
      state.dados.valor = msg;

      await sendMessage(
        telefone,
        "Gerando resumo do imóvel para o corretor..."
      );

      const resumoVenda = await iaResumo(
        "venda_imovel",
        state.dados,
        telefone
      );

      await sendMessage(telefone, resumoVenda);
      await sendMessage(
        telefone,
        "Informações enviadas para um corretor da *JF Almeida*. Ele vai te chamar para continuar o atendimento. 📲"
      );

      updateState(telefone, {
        etapa: "aguardando_corretor",
        dados: {},
      });

      return;
  }
};
