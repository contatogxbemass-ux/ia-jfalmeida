const express = require("express");
const router = express.Router();

const { getState, updateState } = require("../services/state.service");
const { sendText } = require("../services/zapi.service");
const { sendButtons } = require("../services/buttons.service");

// FLOWS
const menuFlow = require("../flows/menu.flow");
const compraFlow = require("../flows/compra.flow");
const aluguelFlow = require("../flows/aluguel.flow");
const vendaFlow = require("../flows/venda.flow");

router.post("/", async (req, res) => {

  console.log("📩 RECEBIDO DO Z-API:", JSON.stringify(req.body, null, 2));

  const telefone = req.body.phone || req.body.connectedPhone;
  const msg = req.body.text?.message?.trim() || null;

  if (!telefone || !msg) {
    return res.sendStatus(200);
  }

  // BLOQUEIO DE GRUPO
  if (req.body.isGroup === true || telefone.includes("-group") || telefone.endsWith("@g.us")) {
    console.log("⛔ Mensagem de grupo ignorada");
    return res.sendStatus(200);
  }

  // ESTADO DO USUÁRIO
  let state = getState(telefone);
  if (!state) {
    state = { etapa: "menu", dados: {}, lastMessageId: null };
    updateState(telefone, state);
  }

  // ANTI-DUPLICIDADE
  const messageId = req.body.messageId;
  if (state.lastMessageId === messageId) {
    console.log("🔁 Mensagem duplicada ignorada");
    return res.sendStatus(200);
  }
  updateState(telefone, { ...state, lastMessageId: messageId });

  const msgLower = msg.toLowerCase();

  // =============================
  // RESET → MENU
  // =============================
  if (msgLower === "menu") {
    updateState(telefone, { etapa: "menu", dados: {} });

    await sendButtons(telefone, "Menu principal:", [
      { id: "1", text: "Comprar" },
      { id: "2", text: "Alugar" },
      { id: "3", text: "Vender" }
    ]);

    return res.sendStatus(200);
  }

  // =============================
  // MENU
  // =============================
  if (state.etapa === "menu") {
    await menuFlow(telefone, msg, state);
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

  await sendText(telefone, "Não entendi. Envie *menu*.");
  return res.sendStatus(200);
});

module.exports = router;
