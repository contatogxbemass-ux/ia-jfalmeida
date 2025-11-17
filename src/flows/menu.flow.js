const { updateState } = require("../services/state.service");
const { sendText } = require("../services/zapi.service");

module.exports = async function menuFlow(telefone, msg, state) {

    const op = msg.trim(); // mensagem enviada

    // ======================
    // OPÇÃO 1 — Comprar
    // ======================
    if (op === "1") {
        updateState(telefone, { etapa: "compra_tipo", dados: {} });

        await sendText(
            telefone,
            "Ótimo! Qual *tipo de imóvel* você procura?\n\nApartamento\nCasa\nSobrado"
        );
        return;
    }

    // ======================
    // OPÇÃO 2 — Alugar
    // ======================
    if (op === "2") {
        updateState(telefone, { etapa: "alug_cliente_tipo", dados: {} });

        await sendText(
            telefone,
            "Perfeito! Qual *tipo de imóvel* você deseja alugar?\n\nApartamento\nCasa\nKitnet"
        );
        return;
    }

    // ======================
    // OPÇÃO 3 — Vender
    // ======================
    if (op === "3") {
        updateState(telefone, { etapa: "venda_tipo", dados: {} });

        await sendText(
            telefone,
            "Vamos lá! Qual *tipo de imóvel* você deseja vender?\n\nApartamento\nCasa\nSobrado"
        );
        return;
    }

    // ======================
    // OPÇÃO INVÁLIDA
    // ======================
    await sendText(
        telefone,
        "Opção inválida. Digite uma opção do menu."
    );
};
