const { sendMessage } = require("../services/zapi.service");
const { updateState } = require("../services/state.service");
const { iaResumo } = require("../services/openai.service");

module.exports = async function aluguelFlow(telefone, msg, state) {

    switch (state.etapa) {

        case "alug_cliente_tipo":
            state.dados.tipo = msg;
            updateState(telefone, { etapa: "alug_cliente_regiao", dados: state.dados });
            await sendMessage(telefone, "Qual bairro/região você deseja?");
            return;

        case "alug_cliente_regiao":
            state.dados.regiao = msg;
            updateState(telefone, { etapa: "alug_cliente_orcamento", dados: state.dados });
            await sendMessage(telefone, "Qual seu orçamento máximo mensal?");
            return;

        case "alug_cliente_orcamento":
            state.dados.orcamento = msg;
            updateState(telefone, { etapa: "alug_cliente_quartos", dados: state.dados });
            await sendMessage(telefone, "Quantos quartos você precisa?");
            return;

        case "alug_cliente_quartos":
            state.dados.quartos = msg;
            updateState(telefone, { etapa: "alug_cliente_data", dados: state.dados });
            await sendMessage(telefone, "Quando pretende se mudar?");
            return;

        case "alug_cliente_data":
            state.dados.dataMudanca = msg;
            updateState(telefone, { etapa: "alug_cliente_finalidade", dados: state.dados });
            await sendMessage(telefone, "Finalidade: *moradia* ou *empresa*?");
            return;

        case "alug_cliente_finalidade":
            state.dados.finalidade = msg;

            await sendMessage(telefone, "Gerando resumo para o corretor...");
            const resumo = await iaResumo("aluguel_cliente", state.dados, telefone);

            await sendMessage(telefone, resumo);
            await sendMessage(telefone, "Informações enviadas ao corretor!");

            updateState(telefone, {
                etapa: "aguardando_corretor",
                dados: {}
            });
            return;
    }
};
