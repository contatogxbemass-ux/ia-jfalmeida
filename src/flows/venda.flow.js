const { updateState } = require("../services/state.service");
const { sendText } = require("../services/zapi.service");
const { gerarResumoIA } = require("../services/openai.service");

module.exports = async function vendaFlow(telefone, msg, state) {

    if (state.etapa === "venda_tipo") {
        state.dados.tipo = msg;
        updateState(telefone, { etapa: "venda_local", dados: state.dados });
        return sendText(telefone, "Qual bairro/região?");
    }

    if (state.etapa === "venda_local") {
        state.dados.local = msg;
        updateState(telefone, { etapa: "venda_tamanho", dados: state.dados });
        return sendText(telefone, "Tamanho (m² / quartos)?");
    }

    if (state.etapa === "venda_tamanho") {
        state.dados.tamanho = msg;
        updateState(telefone, { etapa: "venda_estado", dados: state.dados });
        return sendText(telefone, "Estado de conservação?");
    }

    if (state.etapa === "venda_estado") {
        state.dados.estado = msg;
        updateState(telefone, { etapa: "venda_valor", dados: state.dados });
        return sendText(telefone, "Valor desejado?");
    }

    if (state.etapa === "venda_valor") {
        state.dados.valor = msg;

        const resumo = await gerarResumoIA("venda_imovel", state.dados, telefone);
        await sendText(telefone, resumo);
        await sendText(telefone, "Informações enviadas ao corretor!");

        updateState(telefone, { etapa: "aguardando_corretor" });
        return;
    }
};
