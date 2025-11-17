const express = require("express");
const router = express.Router();

const { getState, updateState, resetState } = require("../services/state.service");
const { sendMessage } = require("../services/zapi.service");

// FLOWS
const menuFlow = require("../flows/menu.flow");
const compraFlow = require("../flows/compra.flow");
const aluguelFlow = require("../flows/aluguel.flow");
const vendaFlow = require("../flows/venda.flow");

// ===============================================
// WEBHOOK — ROTA PRINCIPAL
// ===============================================
router.post("/", async (req, res) => {

  console.log("📩 RECEBIDO DO Z-API:", JSON.stringify(req.body, null, 2));

  const telefone = req.body.phone || req.body.connectedPhone;
  const msg = req.body.text?.message?.trim() || null;

  if (!telefone || !msg) {
    return res.sendStatus(200);
  }

  // BLOQUEIO DE GRUPOS
  if (req.body.isGroup === true || telefone.includes("-group")) {
    console.log("⛔ BLOQUEADO: Mensagem de grupo ignorada");
    return res.sendStatus(200);
  }

  // CARREGA ESTADO
  let state = getState(telefone);

  if (!state) {
    state = {
      etapa: "menu",
      dados: {},
      lastMessageId: null
    };
    updateState(telefone, state);
  }

  // ANTI-DUPLICIDADE
  const messageId = req.body.messageId;
  if (state.lastMessageId === messageId) {
    console.log("🔁 Ignorado: mensagem duplicada.");
    return res.sendStatus(200);
  }

  updateState(telefone, { ...state, lastMessageId: messageId });

  const msgLower = msg.toLowerCase();

  // RESET PARA MENU
  if (msgLower === "menu") {
    updateState(telefone, { etapa: "menu", dados: {} });
    await sendMessage(telefone, "Menu principal:");
    await menuFlow(telefone, msg, state);
    return res.sendStatus(200);
  }

  // ============================
  // FLUXO MENU
  // ============================
  if (state.etapa === "menu") {
    await menuFlow(telefone, msg, state);
    return res.sendStatus(200);
  }

  // ============================
  // FLUXOS PRINCIPAIS
  // ============================
  switch (true) {
    case state.etapa.startsWith("compra_"):
      await compraFlow(telefone, msg, state);
      return res.sendStatus(200);

    case state.etapa.startsWith("alug_"):
      await aluguelFlow(telefone, msg, state);
      return res.sendStatus(200);

    case state.etapa.startsWith("venda_"):
      await vendaFlow(telefone, msg, state);
      return res.sendStatus(200);

    default:
      await sendMessage(telefone, "Não entendi. Envie *menu*.");
      return res.sendStatus(200);
  }
});

module.exports = router;
