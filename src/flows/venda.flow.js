const { sendMessage } = require("../services/zapi.service");
const { updateState } = require("../services/state.service");
const { iaResumo } = require("../services/openai.service");

module.exports = async function vendaFlow(telefone, msg, state) {

    switch (state.etapa) {

        case "venda_tipo":
            state.dados.tipo = msg;
            updateState(telefone, { etapa: "venda_regiao", dados: state.dados });
            return sendMessage(telefone, "O imóvel fica em qual *bairro/região*?");
        
        case "venda_regiao":
            state.dados.regiao = msg;
            updateState(telefone, { etapa: "venda_tamanho", dados: state.dados });
            return sendMessage(telefone, "Qual o *tamanho* ou *número de quartos*?");
        
        case "venda_tamanho":
            state.dados.tamanho = msg;
            updateState(telefone, { etapa: "venda_estado", dados: state.dados });
            return sendMessage(telefone, "Estado do imóvel:", [
                { id: "novo", title: "Novo" },
                { id: "reformado", title: "Reformado" },
                { id: "reformar", title: "Precisa de reforma" }
            ]);

        case "venda_estado":
            state.dados.estado = msg;
            updateState(telefone, { etapa: "venda_valor", dados: state.dados });
            return sendMessage(telefone, "Qual o *valor desejado de venda*?");
        
        case "venda_valor":
            state.dados.valor = msg;

            await sendMessage(telefone, "Gerando resumo do imóvel...");
            const resumo = await iaResumo("venda_imovel", state.dados, telefone);
            await sendMessage(telefone, resumo);

            await sendMessage(telefone, "Informações enviadas ao corretor da *JF Almeida*.");

            updateState(telefone, { etapa: "aguardando_corretor", dados: {} });
            return;
    }
};
