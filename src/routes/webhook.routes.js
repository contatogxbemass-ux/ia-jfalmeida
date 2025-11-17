const express = require("express");
const router = express.Router();

const { getState, updateState } = require("../services/state.service");
const { sendText } = require("../services/zapi.service");

const menuFlow = require("../flows/menu.flow");
const compraFlow = require("../flows/compra.flow");
const aluguelFlow = require("../flows/aluguel.flow");
const vendaFlow = require("../flows/venda.flow");

// IMPORTA O MENU BONITO
const { menuPrincipal } = require("../utils/menu.util");

// ======================================================
// 🔥 WEBHOOK PRINCIPAL
// ======================================================
router.post("/", async (req, res) => {

  console.log("📩 RECEBIDO DO Z-API:", JSON.stringify(req.body, null, 2));

  const telefone = req.body.phone || req.body.connectedPhone;
  const msg = req.body.text?.message?.trim() || null;

  if (!telefone || !msg) return res.sendStatus(200);

  // Bloqueio de grupos
  if (req.body.isGroup || telefone.includes("-group") || telefone.endsWith("@g.us")) {
    console.log("⛔ Mensagem de grupo bloqueada");
    return res.sendStatus(200);
  }

  // Carrega estado do usuário
  let state = getState(telefone);

  // Cria novo estado se não existir
  if (!state) {
    state = { etapa: "menu", dados: {}, lastMessageId: null, silencio: false, paused: false };
    updateState(telefone, state);

    await sendText(telefone, menuPrincipal());
    return res.sendStatus(200);
  }

  const messageId = req.body.messageId;

  // Anti duplicidade
  if (state.lastMessageId === messageId) return res.sendStatus(200);
  updateState(telefone, { ...state, lastMessageId: messageId });

  const msgLower = msg.toLowerCase();

  // ======================================================
  // 🔥 COMANDOS GLOBAIS /pausar e /voltar
  // ======================================================

  if (msgLower === "/pausar") {
    updateState(telefone, { paused: true });
    await sendText(telefone, "⏸️ Bot pausado. Digite /voltar para continuar.");
    return res.sendStatus(200);
  }

  if (msgLower === "/voltar") {
    updateState(telefone, { paused: false });
    await sendText(telefone, "▶️ Bot retomado.");
    return res.sendStatus(200);
  }

  // Bloqueia qualquer ação enquanto estiver pausado
  if (state.paused) {
    await sendText(telefone, "Bot pausado. Digite /voltar para continuar.");
    return res.sendStatus(200);
  }

  // ======================================================
  // 🔥 RESET DE MENU
  // ======================================================
  if (msgLower === "menu") {
    updateState(telefone, { etapa: "menu", dados: {} });
    await sendText(telefone, menuPrincipal());
    return res.sendStatus(200);
  }

  // ======================================================
  // 🔥 MENU
  // ======================================================
  if (state.etapa === "menu") {
    await menuFlow(telefone, msg, state);
    return res.sendStatus(200);
  }

  // ======================================================
  // 🔥 DIRECIONAMENTO PARA OS FLUXOS
  // ======================================================

  // COMPRA
  if (state.etapa.startsWith("compra_")) {
    await compraFlow(telefone, msg, state);
    return res.sendStatus(200);
  }

  // ALUGUEL (cliente + proprietário)
  if (state.etapa.startsWith("alug_")) {
    await aluguelFlow(telefone, msg, state);
    return res.sendStatus(200);
  }

  // VENDA
  if (state.etapa.startsWith("venda_")) {
    await vendaFlow(telefone, msg, state);
    return res.sendStatus(200);
  }

  // FAIL SAFE
  await sendText(telefone, "Não entendi. Digite *menu*.");
  updateState(telefone, { etapa: "menu", dados: {} });

  return res.sendStatus(200);
});

module.exports = router;
