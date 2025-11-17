const express = require("express");
const router = express.Router();

const { getState, updateState, resetState } = require("../services/state.service");
const { sendText } = require("../services/zapi.service");

const menuFlow = require("../flows/menu.flow");
const compraFlow = require("../flows/compra.flow");
const aluguelFlow = require("../flows/aluguel.flow");
const vendaFlow = require("../flows/venda.flow");

function menuPrincipal() {
    return (
        "👋 *Bem-vindo(a) à JF Almeida Imóveis!*\n\n" +
        "🏡 *IMÓVEIS*\n" +
        "⿡ *1 — Comprar*\n" +
        "⿢ *2 — Alugar*\n\n" +
        "🏠 *PROPRIETÁRIO*\n" +
        "⿤ *3 — Vender imóvel*\n" +
        "⿥ *4 — Colocar imóvel para aluguel*\n\n" +
        "👤 *HUMANO*\n" +
        "⿠ *0 — Falar com corretor*\n\n" +
        "Digite *menu* a qualquer momento."
    );
}

router.post("/", async (req, res) => {
    console.log("📩 RECEBIDO:", JSON.stringify(req.body, null, 2));

    const telefone = req.body.phone || req.body.connectedPhone;
    const msg = req.body.text?.message?.trim() || null;

    if (!telefone || !msg) return res.sendStatus(200);

    if (req.body.isGroup || telefone.includes("-group") || telefone.endsWith("@g.us")) {
        return res.sendStatus(200);
    }

    let state = getState(telefone);

    const messageId = req.body.messageId;
    if (state.lastMessageId === messageId) return res.sendStatus(200);
    updateState(telefone, { lastMessageId: messageId });

    const msgLower = msg.toLowerCase();

    if (msgLower === "menu") {
        resetState(telefone);
        await sendText(telefone, menuPrincipal());
        return res.sendStatus(200);
    }

    if (state.etapa === "menu") {
        await menuFlow(telefone, msg, state);
        return res.sendStatus(200);
    }

    if (state.etapa.startsWith("compra_")) {
        await compraFlow(telefone, msg, state);
        return res.sendStatus(200);
    }

    if (state.etapa.startsWith("alug_")) {
        await aluguelFlow(telefone, msg, state);
        return res.sendStatus(200);
    }

    if (state.etapa.startsWith("venda_")) {
        await vendaFlow(telefone, msg, state);
        return res.sendStatus(200);
    }

    resetState(telefone);
    await sendText(telefone, menuPrincipal());
    return res.sendStatus(200);
});

module.exports = router;
