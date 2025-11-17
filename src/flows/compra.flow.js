const { sendMessage } = require("../services/zapi.service");
const { updateState } = require("../services/state.service");
const { iaResumo } = require("../services/openai.service");

module.exports = async function compraFlow(telefone, msg, state) {
  switch (state.etapa) {
    case "compra_tipo":
      state.dados.tipo = msg;
      updateState(telefone, {
        etapa: "compra_regiao",
        dados: state.dados,
      });
      await sendMessage(telefone, "Perfeito! Qual *bairro/região* você prefere?");
      return;

    case "compra_regiao":
      state.dados.regiao = msg;
      updateState(telefone, {
        etapa: "compra_orcamento",
        dados: state.dados,
      });
      await sendMessage(telefone, "Ótimo! Qual é o seu *orçamento máximo*?");
      return;

    case "compra_orcamento":
      state.dados.orcamento = msg;
      updateState(telefone, {
        etapa: "compra_pagamento",
        dados: state.dados,
      });
      await sendMessage(telefone, "A compra seria *à vista* ou *financiada*?");
      return;

    case "compra_pagamento":
      state.dados.pagamento = msg;
      updateState(telefone, {
        etapa: "compra_urgencia",
        dados: state.dados,
      });
      await sendMessage(telefone, "Qual a *urgência* da compra? (baixa / média / alta)");
      return;

    case "compra_urgencia":
      state.dados.urgencia = msg;

      await sendMessage(telefone, "Gerando resumo para o corretor...");
      const resumoCompra = await iaResumo("compra_imovel", state.dados, telefone);
      await sendMessage(telefone, resumoCompra);
      await sendMessage(
        telefone,
        "Informações enviadas para um corretor da *JF Almeida*. Ele vai te chamar aqui no WhatsApp. 📲"
      );

      updateState(telefone, {
        etapa: "aguardando_corretor",
        dados: {},
      });
      return;
  }
};
