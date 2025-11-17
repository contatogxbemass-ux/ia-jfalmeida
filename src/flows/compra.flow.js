const { updateState } = require("../services/state.service");
const { sendText } = require("../services/zapi.service");
const { gerarResumoIA } = require("../services/openai.service");

module.exports = async function compraFlow(telefone, msg, state) {

    if (state.etapa === "compra_tipo") {
        updateState(telefone, { etapa: "compra_regiao", dados: { tipo: msg } });
        return sendText(telefone, "Qual bairro/região?");
    }

    if (state.etapa === "compra_regiao") {
        state.dados.regiao = msg;
        updateState(telefone, { etapa: "compra_orcamento", dados: state.dados });
        return sendText(telefone, "Orçamento máximo?");
    }

    if (state.etapa === "compra_orcamento") {
        state.dados.orcamento = msg;
        updateState(telefone, { etapa: "compra_pagamento", dados: state.dados });
        return sendText(telefone, "Financiado ou à vista?");
    }

    if (state.etapa === "compra_pagamento") {
        state.dados.pagamento = msg;
        updateState(telefone, { etapa: "compra_urgencia", dados: state.dados });
        return sendText(telefone, "Urgência? (baixa/média/alta)");
    }

    if (state.etapa === "compra_urgencia") {
        state.dados.urgencia = msg;

        const resumo = await gerarResumoIA("compra_imovel", state.dados, telefone);
        await sendText(telefone, resumo);
        await sendText(telefone, "Informações enviadas ao corretor!");

        updateState(telefone, { etapa: "aguardando_corretor" });
        return;
    }
};
