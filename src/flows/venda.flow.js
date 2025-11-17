const { sendText } = require("../services/zapi.service");
const { updateState } = require("../services/state.service");
const { iaResumo } = require("../services/openai.service");

module.exports = async function vendaFlow(telefone, msg, state) {

    switch (state.etapa) {

        case "venda_tipo":
            state.dados.tipo = msg;
            updateState(telefone, { etapa: "venda_regiao", dados: state.dados });
            return sendText(telefone, "📍 Em qual bairro está o imóvel?");

        case "venda_regiao":
            state.dados.regiao = msg;
            updateState(telefone, { etapa: "venda_tamanho", dados: state.dados });
            return sendText(telefone, "📐 Quantos quartos / tamanho do imóvel?");

        case "venda_tamanho":
            state.dados.tamanho = msg;
            updateState(telefone, { etapa: "venda_estado", dados: state.dados });
            return sendText(telefone, "🛠️ Estado do imóvel? (novo, reformado, precisa de reforma)");

        case "venda_estado":
            state.dados.estado = msg;
            updateState(telefone, { etapa: "venda_valor", dados: state.dados });
            return sendText(telefone, "💵 Qual o valor desejado na venda?");

        case "venda_valor":
            state.dados.valor = msg;

            await sendText(telefone, "Gerando resumo...");
            const resumo = await iaResumo("venda_imovel", state.dados, telefone);

            await sendText(telefone, resumo);
            await sendText(telefone, "Informações enviadas ao corretor!");

            updateState(telefone, { etapa: "aguardando_corretor", dados: {} });
            return;
    }
};
