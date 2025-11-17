const { sendText } = require("../services/zapi.service");
const { updateState } = require("../services/state.service");

module.exports = async function menuFlow(telefone, msg, state) {

    const op = msg.trim();

    // ====== COMPRAR ======
    if (op === "1") {
        updateState(telefone, { etapa: "compra_tipo", dados: {} });
        return sendText(
            telefone,
            "🏘️ *Compra de Imóvel*\n\nEscolha o tipo:\n\n1 — Apartamento\n2 — Casa\n3 — Sobrado"
        );
    }

    // ====== ALUGAR ======
    if (op === "2") {
        updateState(telefone, { etapa: "alug_cliente_tipo", dados: {} });
        return sendText(
            telefone,
            "🏡 *Aluguel de Imóvel*\n\nSelecione o tipo:\n\n1 — Apartamento\n2 — Casa\n3 — Kitnet"
        );
    }

    // ====== VENDER ======
    if (op === "3") {
        updateState(telefone, { etapa: "venda_tipo", dados: {} });
        return sendText(
            telefone,
            "💰 *Venda de Imóvel*\n\nSelecione o tipo:\n\n1 — Apartamento\n2 — Casa\n3 — Sobrado"
        );
    }

    // Opção inválida
    return sendText(telefone, "Opção inválida. Toque em alguma opção do menu.");
};
