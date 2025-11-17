const { updateState } = require("../services/state.service");
const { sendText } = require("../services/zapi.service");

module.exports = async function menuFlow(phone, msg, state) {
    const op = msg.trim();

    switch (op) {
        case "1":
            updateState(phone, { etapa: "compra_tipo", dados: {} });
            return sendText(phone, "Ótimo! Qual *tipo de imóvel* você procura?");
        
        case "2":
            updateState(phone, { etapa: "alug_cliente_tipo", dados: {} });
            return sendText(phone, "Perfeito! Qual *tipo de imóvel* você quer alugar?");
        
        case "3":
            updateState(phone, { etapa: "venda_tipo", dados: {} });
            return sendText(phone, "Certo! Qual *tipo de imóvel* você quer vender?");
        
        case "4":
            updateState(phone, { etapa: "alug_prop_tipo", dados: {} });
            return sendText(phone, "Qual *tipo de imóvel* quer colocar para aluguel?");
        
        case "0":
            updateState(phone, { etapa: "aguardando_corretor" });
            return sendText(phone, "Certo! Encaminhando você para um corretor humano.");
        
        default:
            return sendText(phone, "Opção inválida. Digite uma opção do menu.");
    }
};
