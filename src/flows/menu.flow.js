const { sendMessage } = require("../services/zapi.service");
const { updateState } = require("../services/state.service");

module.exports = async function menuFlow(telefone, msg, state) {

    const op = msg.trim();

    if (op === "1") {
        updateState(telefone, { etapa: "compra_tipo", dados: {} });
        return sendMessage(telefone, "Qual *tipo de imóvel* deseja comprar?", [
            { id: "apto", title: "Apartamento" },
            { id: "casa", title: "Casa" },
            { id: "sobrado", title: "Sobrado" }
        ]);
    }

    if (op === "2") {
        updateState(telefone, { etapa: "alug_cliente_tipo", dados: {} });
        return sendMessage(telefone, "Qual *tipo de imóvel* deseja alugar?", [
            { id: "apto", title: "Apartamento" },
            { id: "casa", title: "Casa" },
            { id: "kitnet", title: "Kitnet" }
        ]);
    }

    if (op === "3") {
        updateState(telefone, { etapa: "venda_tipo", dados: {} });
        return sendMessage(telefone, "Qual *tipo de imóvel* deseja vender?", [
            { id: "apto", title: "Apartamento" },
            { id: "casa", title: "Casa" },
            { id: "sobrado", title: "Sobrado" }
        ]);
    }

    return sendMessage(telefone, "Escolha uma opção do menu:");
};
