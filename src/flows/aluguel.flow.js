const { sendMessage } = require("../services/zapi.service");
const { updateState } = require("../services/state.service");
const { iaResumo } = require("../services/openai.service");

module.exports = async function aluguelFlow(telefone, msg, state) {

    switch (state.etapa) {

        case "alug_cliente_tipo":
            state.dados.tipo = msg;
            updateState(telefone, { etapa: "alug_cliente_regiao", dados: state.dados });
            return sendMessage(telefone, "Qual *bairro/região* você deseja?");
        
        case "alug_cliente_regiao":
            state.dados.regiao = msg;
            updateState(telefone, { etapa: "alug_cliente_orcamento", dados: state.dados });
            return sendMessage(telefone, "Qual seu *orçamento máximo mensal*?");
        
        case "alug_cliente_orcamento":
            state.dados.orcamento = msg;
            updateState(telefone, { etapa: "alug_cliente_quartos", dados: state.dados });
            return sendMessage(telefone, "Quantos *quartos* você precisa?", [
                { id: "1", title: "1 quarto" },
                { id: "2", title: "2 quartos" },
                { id: "3", title: "3 quartos" }
            ]);

        case "alug_cliente_quartos":
            state.dados.quartos = msg;
            updateState(telefone, { etapa: "alug_cliente_data", dados: state.dados });
            return sendMessage(telefone, "Quando pretende se mudar?");
        
        case "alug_cliente_data":
            state.dados.data = msg;
            updateState(telefone, { etapa: "alug_cliente_finalidade", dados: state.dados });
            return sendMessage(telefone, "Finalidade:", [
                { id: "moradia", title: "Moradia" },
                { id: "empresa", title: "Empresa" }
            ]);

        case "alug_cliente_finalidade":
            state.dados.finalidade = msg;

            await sendMessage(telefone, "Gerando resumo da sua solicitação...");
            const resumo = await iaResumo("aluguel_cliente", state.dados, telefone);
            await sendMessage(telefone, resumo);

            await sendMessage(telefone, "Informações enviadas ao corretor da *JF Almeida*. Ele vai te chamar.");

            updateState(telefone, { etapa: "aguardando_corretor", dados: {} });
            return;
    }
};
