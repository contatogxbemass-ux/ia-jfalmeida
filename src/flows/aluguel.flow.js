const { sendText } = require("../services/zapi.service");
const { updateState } = require("../services/state.service");
const { iaResumo } = require("../services/openai.service");

module.exports = async function aluguelFlow(telefone, msg, state) {

    switch (state.etapa) {

        case "alug_cliente_tipo":
            state.dados.tipo = msg;
            updateState(telefone, { etapa: "alug_cliente_regiao", dados: state.dados });
            return sendText(telefone, "📍 Qual bairro/região deseja?");

        case "alug_cliente_regiao":
            state.dados.regiao = msg;
            updateState(telefone, { etapa: "alug_cliente_orcamento", dados: state.dados });
            return sendText(telefone, "💵 Qual o orçamento máximo mensal?");

        case "alug_cliente_orcamento":
            state.dados.orcamento = msg;
            updateState(telefone, { etapa: "alug_cliente_quartos", dados: state.dados });
            return sendText(telefone, "🛏️ Quantos quartos precisa?");

        case "alug_cliente_quartos":
            state.dados.quartos = msg;
            updateState(telefone, { etapa: "alug_cliente_data", dados: state.dados });
            return sendText(telefone, "📅 Quando pretende se mudar?");

        case "alug_cliente_data":
            state.dados.data = msg;

            await sendText(telefone, "Gerando resumo...");
            const resumo = await iaResumo("aluguel_cliente", state.dados, telefone);

            await sendText(telefone, resumo);
            await sendText(telefone, "As informações já foram enviadas ao corretor!");

            updateState(telefone, { etapa: "aguardando_corretor", dados: {} });
            return;
    }
};
