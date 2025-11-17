const { sendMessage } = require("../services/zapi.service");
const { updateState } = require("../services/state.service");
const { iaResumo } = require("../services/openai.service");

module.exports = async function compraFlow(telefone, msg, state) {

    switch (state.etapa) {

        case "compra_tipo":
            state.dados.tipo = msg;
            updateState(telefone, { etapa: "compra_regiao", dados: state.dados });
            return sendMessage(telefone, "Qual *região/bairro* você procura?");
        
        case "compra_regiao":
            state.dados.regiao = msg;
            updateState(telefone, { etapa: "compra_orcamento", dados: state.dados });
            return sendMessage(telefone, "Qual seu *orçamento* máximo?");
        
        case "compra_orcamento":
            state.dados.orcamento = msg;
            updateState(telefone, { etapa: "compra_pagamento", dados: state.dados });
            return sendMessage(telefone, "Forma de pagamento:", [
                { id: "avista", title: "À vista" },
                { id: "financiado", title: "Financiado" }
            ]);

        case "compra_pagamento":
            state.dados.pagamento = msg;
            updateState(telefone, { etapa: "compra_urgencia", dados: state.dados });
            return sendMessage(telefone, "Urgência:", [
                { id: "alta", title: "Alta" },
                { id: "media", title: "Média" },
                { id: "baixa", title: "Baixa" }
            ]);

        case "compra_urgencia":
            state.dados.urgencia = msg;

            await sendMessage(telefone, "Gerando resumo da sua solicitação...");
            const resumo = await iaResumo("compra_imovel", state.dados, telefone);
            await sendMessage(telefone, resumo);

            await sendMessage(telefone, "Informações enviadas ao corretor da *JF Almeida*. Ele vai falar com você em breve.");

            updateState(telefone, { etapa: "aguardando_corretor", dados: {} });
            return;
    }
};
