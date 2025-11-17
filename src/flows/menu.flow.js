const { sendButtons } = require("../services/buttons.service");
const { updateState } = require("../services/state.service");

module.exports = async function menuFlow(telefone, msg, state) {

    const op = msg.trim();

    // MENU → OPÇÃO 1
    if (op === "1") {
        updateState(telefone, { etapa: "compra_tipo", dados: {} });

        return sendButtons(telefone, "Qual *tipo de imóvel* deseja comprar?", [
            { id: "apto", text: "Apartamento" },
            { id: "casa", text: "Casa" },
            { id: "sobrado", text: "Sobrado" }
        ]);
    }

    // MENU → OPÇÃO 2
    if (op === "2") {
        updateState(telefone, { etapa: "alug_cliente_tipo", dados: {} });

        return sendButtons(telefone, "Qual *tipo de imóvel* deseja alugar?", [
            { id: "apto", text: "Apartamento" },
            { id: "casa", text: "Casa" },
            { id: "kit", text: "Kitnet" }
        ]);
    }

    // MENU → OPÇÃO 3
    if (op === "3") {
        updateState(telefone, { etapa: "venda_tipo", dados: {} });

        return sendButtons(telefone, "Qual *tipo de imóvel* deseja vender?", [
            { id: "apto", text: "Apartamento" },
            { id: "casa", text: "Casa" },
            { id: "sobrado", text: "Sobrado" }
        ]);
    }

    return sendButtons(telefone, "Escolha uma opção do menu:", [
        { id: "1", text: "Comprar" },
        { id: "2", text: "Alugar" },
        { id: "3", text: "Vender" }
    ]);
};
