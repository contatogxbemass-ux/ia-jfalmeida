const { sendText } = require("../services/zapi.service");
const { updateState } = require("../services/state.service");
const { iaResumo } = require("../services/openai.service");

module.exports = async function compraFlow(telefone, msg, state) {

    switch (state.etapa) {

        case "compra_tipo":
            state.dados.tipo = msg;
            updateState(telefone, { etapa: "compra_regiao", dados: state.dados });
            return sendText(telefone, "📍 Qual bairro/região deseja?");

        case "compra_regiao":
            state.dados.regiao = msg;
            updateState(telefone, { etapa: "compra_orcamento", dados: state.dados });
            return sendText(telefone, "💵 Qual seu orçamento máximo?");

        case "compra_orcamento":
            state.dados.orcamento = msg;
            updateState(telefone, { etapa: "compra_forma", dados: state.dados });
            return sendText(telefone, "💳 Qual a forma de pagamento? (ex: financiamento, à vista)");

        case "compra_forma":
            state.dados.forma = msg;
            updateState(telefone, { etapa: "compra_urgencia", dados: state.dados });
            return sendText(telefone, "⏱️ Qual o nível de urgência? (baixa, média, alta)");

        case "compra_urgencia":
            state.dados.urgencia = msg;

            await sendText(telefone, "Gerando resumo...");
            const resumo = await iaResumo("compra_imovel", state.dados, telefone);

            await sendText(telefone, resumo);
            await sendText(telefone, "Informações enviadas para o corretor!");

            updateState(telefone, { etapa: "aguardando_corretor", dados: {} });
            return;
    }
};
