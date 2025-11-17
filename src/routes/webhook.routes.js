const express = require("express");
const router = express.Router();

const { getState, updateState, resetState } = require("../services/state.service");
const { sendText } = require("../services/zapi.service");

// FLOWS
const menuFlow = require("../flows/menu.flow");
const compraFlow = require("../flows/compra.flow");
const aluguelFlow = require("../flows/aluguel.flow");
const vendaFlow = require("../flows/venda.flow");
const listFlow = require("../flows/list.flow");

// =========================================
// 🔥 WEBHOOK Z-API
// =========================================
router.post("/", async (req, res) => {

    console.log("📩 RECEBIDO DO Z-API:", JSON.stringify(req.body, null, 2));

    const telefone = req.body.phone || req.body.connectedPhone;
    const mensagem = req.body.text?.message?.trim() || null;

    // Ignorar mensagens inválidas
    if (!telefone || !mensagem) return res.sendStatus(200);

    // Bloquear grupos
    if (req.body.isGroup || telefone.endsWith("@g.us") || telefone.includes("-group")) {
        console.log("⛔ Ignorado (grupo).");
        return res.sendStatus(200);
    }

    // Carrega estado do usuário
    let state = getState(telefone);

    // Evitar duplicidade
    const messageId = req.body.messageId;
    if (state.lastMessageId === messageId) {
        console.log("🔁 Ignorado (duplicado).");
        return res.sendStatus(200);
    }
    updateState(telefone, { lastMessageId: messageId });

    const msgLower = mensagem.toLowerCase();

    // RESET MENU
    if (msgLower === "menu") {
        resetState(telefone);
        await sendText(
            telefone,
            "📍 *Menu Principal*\n\n1 — Comprar imóvel\n2 — Alugar imóvel\n3 — Ver imóveis\n4 — Vender imóvel\n5 — Colocar imóvel para aluguel\n6 — Financiamentos\n0 — Falar com corretor"
        );
        return res.sendStatus(200);
    }

    // =========================================
    // PRIMEIRO CONTATO → Envia menu e inicia estado
    // =========================================
    if (!state || !state.etapa) {
        resetState(telefone);

        await sendText(
            telefone,
            "📍 *Menu Principal*\n\n1 — Comprar imóvel\n2 — Alugar imóvel\n3 — Ver imóveis\n4 — Vender imóvel\n5 — Colocar imóvel para aluguel\n6 — Financiamentos\n0 — Falar com corretor"
        );

        return res.sendStatus(200);
    }

    // =========================================
    // MENU PRINCIPAL
    // =========================================
    if (state.etapa === "menu") {
        await menuFlow(telefone, mensagem, state);
        return res.sendStatus(200);
    }

    // =========================================
    // COMPRA
    // =========================================
    if (state.etapa.startsWith("compra_")) {
        await compraFlow(telefone, mensagem, state);
        return res.sendStatus(200);
    }

    // =========================================
    // ALUGUEL
    // =========================================
    if (state.etapa.startsWith("alug_")) {
        await aluguelFlow(telefone, mensagem, state);
        return res.sendStatus(200);
    }

    // =========================================
    // VENDA
    // =========================================
    if (state.etapa.startsWith("venda_")) {
        await vendaFlow(telefone, mensagem, state);
        return res.sendStatus(200);
    }

    // =========================================
    // LISTAGEM (Ver imóveis)
    // =========================================
    if (state.etapa.startsWith("list_")) {
        await listFlow(telefone, mensagem, state);
        return res.sendStatus(200);
    }

    // =========================================
    // FAILSAFE — volta menu
    // =========================================
    resetState(telefone);
    await sendText(
        telefone,
        "📍 *Menu Principal*\n\n1 — Comprar imóvel\n2 — Alugar imóvel\n3 — Ver imóveis\n4 — Vender imóvel\n5 — Colocar imóvel para aluguel\n6 — Financiamentos\n0 — Falar com corretor"
    );

    return res.sendStatus(200);
});

module.exports = router;
