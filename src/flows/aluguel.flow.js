const { updateState } = require("../services/state.service");
const { sendText } = require("../services/zapi.service");
const { gerarResumoIA } = require("../services/openai.service");

module.exports = async function aluguelFlow(telefone, msg, state) {

    if (state.etapa === "alug_cliente_tipo") {
        state.dados.tipo = msg;
        updateState(telefone, { etapa: "alug_cliente_regiao", dados: state.dados });
        return sendText(telefone, "Qual bairro/região?");
    }

    if (state.etapa === "alug_cliente_regiao") {
        state.dados.regiao = msg;
        updateState(telefone, { etapa: "alug_cliente_orcamento", dados: state.dados });
        return sendText(telefone, "Orçamento máximo?");
    }

    if (state.etapa === "alug_cliente_orcamento") {
        state.dados.orcamento = msg;
        updateState(telefone, { etapa: "alug_cliente_quartos", dados: state.dados });
        return sendText(telefone, "Quantos quartos?");
    }

    if (state.etapa === "alug_cliente_quartos") {
        state.dados.quartos = msg;
        updateState(telefone, { etapa: "alug_cliente_data", dados: state.dados });
        return sendText(telefone, "Quando pretende se mudar?");
    }

    if (state.etapa === "alug_cliente_data") {
        state.dados.dataMudanca = msg;
        updateState(telefone, { etapa: "alug_cliente_finalidade", dados: state.dados });
        return sendText(telefone, "Finalidade? (moradia/empresa)");
    }

    if (state.etapa === "alug_cliente_finalidade") {
        state.dados.finalidade = msg;

        const resumo = await gerarResumoIA("aluguel_imovel", state.dados, telefone);
        await sendText(telefone, resumo);
        await sendText(telefone, "Encaminhado ao corretor!");

        updateState(telefone, { etapa: "aguardando_corretor" });
        return;
    }

    // PROPRIETÁRIO
    if (state.etapa === "alug_prop_tipo") {
        state.dados.tipo = msg;
        updateState(telefone, { etapa: "alug_prop_endereco", dados: state.dados });
        return sendText(telefone, "Endereço completo?");
    }

    if (state.etapa === "alug_prop_endereco") {
        state.dados.endereco = msg;
        updateState(telefone, { etapa: "alug_prop_quartos", dados: state.dados });
        return sendText(telefone, "Quantos quartos?");
    }

    if (state.etapa === "alug_prop_quartos") {
        state.dados.quartos = msg;
        updateState(telefone, { etapa: "alug_prop_estado", dados: state.dados });
        return sendText(telefone, "Estado de conservação?");
    }

    if (state.etapa === "alug_prop_estado") {
        state.dados.estado = msg;
        updateState(telefone, { etapa: "alug_prop_valor", dados: state.dados });
        return sendText(telefone, "Valor desejado?");
    }

    if (state.etapa === "alug_prop_valor") {
        state.dados.valor = msg;
        updateState(telefone, { etapa: "alug_prop_garantia", dados: state.dados });
        return sendText(telefone, "Tipo de garantia?");
    }

    if (state.etapa === "alug_prop_garantia") {
        state.dados.garantia = msg;

        const resumo = await gerarResumoIA("aluguel_proprietario", state.dados, telefone);
        await sendText(telefone, resumo);
        await sendText(telefone, "Corretor irá te chamar em breve!");

        updateState(telefone, { etapa: "aguardando_corretor" });
        return;
    }
};
