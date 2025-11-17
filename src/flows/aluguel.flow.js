const { sendText } = require("../services/zapi.service");
const { updateState } = require("../services/state.service");
const { iaResumo } = require("../services/openai.service");

module.exports = async function aluguelFlow(telefone, msg, state) {
  
  // ============================
  // CLIENTE QUER ALUGAR
  // ============================
  if (state.etapa.startsWith("alug_cliente_")) {
    switch (state.etapa) {
      case "alug_cliente_tipo":
        state.dados.tipo = msg;
        updateState(telefone, {
          etapa: "alug_cliente_regiao",
          dados: state.dados,
        });
        return sendText(telefone, "Qual *bairro/região* você deseja?");

      case "alug_cliente_regiao":
        state.dados.regiao = msg;
        updateState(telefone, {
          etapa: "alug_cliente_orcamento",
          dados: state.dados,
        });
        return sendText(telefone, "Qual seu *orçamento máximo mensal*?");

      case "alug_cliente_orcamento":
        state.dados.orcamento = msg;
        updateState(telefone, {
          etapa: "alug_cliente_quartos",
          dados: state.dados,
        });
        return sendText(telefone, "Quantos *quartos* precisa?");

      case "alug_cliente_quartos":
        state.dados.quartos = msg;
        updateState(telefone, {
          etapa: "alug_cliente_data",
          dados: state.dados,
        });
        return sendText(telefone, "Quando pretende se mudar?");

      case "alug_cliente_data":
        state.dados.data = msg;
        updateState(telefone, {
          etapa: "alug_cliente_finalidade",
          dados: state.dados,
        });
        return sendText(telefone, "Finalidade: *moradia* ou *empresa*?");

      case "alug_cliente_finalidade":
        state.dados.finalidade = msg;

        await sendText(telefone, "Gerando resumo...");
        const resumoCliente = await iaResumo(
          "aluguel_cliente",
          state.dados,
          telefone
        );

        await sendText(telefone, resumoCliente);
        await sendText(telefone, "Informações enviadas ao corretor!");

        updateState(telefone, { etapa: "aguardando_corretor", dados: {} });
        return;
    }
  }

  // ============================
  // PROPRIETÁRIO QUER ALUGAR
  // ============================
  if (state.etapa.startsWith("alug_prop_")) {
    switch (state.etapa) {
      case "alug_prop_tipo":
        state.dados.tipo = msg;
        updateState(telefone, {
          etapa: "alug_prop_endereco",
          dados: state.dados,
        });
        return sendText(telefone, "Qual o *endereço completo* do imóvel?");

      case "alug_prop_endereco":
        state.dados.endereco = msg;
        updateState(telefone, {
          etapa: "alug_prop_quartos",
          dados: state.dados,
        });
        return sendText(telefone, "Quantos *quartos* o imóvel possui?");

      case "alug_prop_quartos":
        state.dados.quartos = msg;
        updateState(telefone, {
          etapa: "alug_prop_estado",
          dados: state.dados,
        });
        return sendText(telefone, "Qual o *estado de conservação*?");

      case "alug_prop_estado":
        state.dados.estado = msg;
        updateState(telefone, {
          etapa: "alug_prop_valor",
          dados: state.dados,
        });
        return sendText(telefone, "Qual o *valor desejado* do aluguel?");

      case "alug_prop_valor":
        state.dados.valor = msg;
        updateState(telefone, {
          etapa: "alug_prop_garantia",
          dados: state.dados,
        });
        return sendText(telefone, "Qual o *tipo de garantia* aceita?");

      case "alug_prop_garantia":
        state.dados.garantia = msg;

        await sendText(telefone, "Gerando resumo...");
        const resumoProp = await iaResumo(
          "aluguel_proprietario",
          state.dados,
          telefone
        );

        await sendText(telefone, resumoProp);
        await sendText(telefone, "Informações enviadas ao corretor!");

        updateState(telefone, { etapa: "aguardando_corretor", dados: {} });
        return;
    }
  }
};
