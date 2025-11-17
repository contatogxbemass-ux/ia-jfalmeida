const express = require("express");
const router = express.Router();

const { getState, updateState, resetState } = require("../services/state.service");
const { sendText } = require("../services/zapi.service");
const menuPrincipal = require("../utils/menu.util");

const compraFlow = require("../flows/compra.flow");
const aluguelFlow = require("../flows/aluguel.flow");
const vendaFlow = require("../flows/venda.flow");
const menuFlow = require("../flows/menu.flow");

router.post("/", async (req, res) => {
    console.log("📩 RECEBIDO DO Z-API:", JSON.stringify(req.body, null, 2));

    const telefone = req.body.phone || req.body.connectedPhone;
    const msg = req.body.text?.message?.trim() || null;
    const messageId = req.body.messageId || null;

    // =============================
    // BLOQUEIO DE GRUPO
    // =============================
    if (!telefone || !msg) return res.sendStatus(200);

    if (req.body.isGroup || telefone.includes("-group") || telefone.endsWith("@g.us")) {
        console.log("⛔ Grupo bloqueado");
        return res.sendStatus(200);
    }

    // =============================
    // ESTADO DO USUÁRIO
    // =============================
    let state = getState(telefone);

    // =============================
    // PRIMEIRA MENSAGEM DO USUÁRIO
    // Sempre manda o menu!
    // =============================
    if (!state.lastMessageId) {
        console.log("📌 PRIMEIRO CONTATO — enviando menu...");
        resetState(telefone);

        await sendText(telefone, menuPrincipal());

        updateState(telefone, { lastMessageId: messageId });
        return res.sendStatus(200);
    }

    // =============================
    // ANTI-DUPLICIDADE
    // =============================
    if (state.lastMessageId === messageId) {
        console.log("🔁 Duplicado, ignorado.");
        return res.sendStatus(200);
    }
    updateState(telefone, { lastMessageId: messageId });

    const msgLower = msg.toLowerCase();

    // =============================
    // RESET PARA MENU
    // =============================
    if (msgLower === "menu") {
        resetState(telefone);
        await sendText(telefone, menuPrincipal());
        return res.sendStatus(200);
    }

    // =============================
    // MENU PRINCIPAL
    // =============================
    if (state.etapa === "menu") {
        await menuFlow(telefone, msg);
        return res.sendStatus(200);
    }

    // =============================
    // FLUXOS PRINCIPAIS
    // =============================
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

    // =============================
    // FAILSAFE
    // =============================
    resetState(telefone);
    await sendText(telefone, menuPrincipal());
    return res.sendStatus(200);
});

module.exports = router;
