const express = require("express");
const router = express.Router();

const { getState, updateState } = require("../services/state.service");
const { sendText } = require("../services/zapi.service");

const menuFlow = require("../flows/menu.flow");
const compraFlow = require("../flows/compra.flow");
const aluguelFlow = require("../flows/aluguel.flow");
const vendaFlow = require("../flows/venda.flow");

router.post("/", async (req, res) => {

  console.log("📩 RECEBIDO DO Z-API:", JSON.stringify(req.body, null, 2));

  const telefone = req.body.phone || req.body.connectedPhone;
  const msg = req.body.text?.message?.trim() || null;

  if (!telefone || !msg) return res.sendStatus(200);

  if (req.body.isGroup || telefone.endsWith("@g.us") || telefone.includes("-group")) {
    return res.sendStatus(200);
  }

  // ===== Carregar ou criar estado =====
  let state = getState(telefone);

  if (!state) {
    state = { etapa: "menu", dados: {}, lastMessageId: null };
    updateState(telefone, state);

    await sendText(
      telefone,
      "📍 *Menu Principal*\n\n1 — Comprar imóvel\n2 — Alugar imóvel\n3 — Vender imóvel"
    );

    return res.sendStatus(200);
  }

  // ===== Evitar duplicidade =====
  const messageId = req.body.messageId;
  if (state.lastMessageId === messageId) return res.sendStatus(200);
  updateState(telefone, { ...state, lastMessageId: messageId });

  const msgLower = msg.toLowerCase();

  // ===== Reset de menu =====
  if (msgLower === "menu") {
    updateState(telefone, { etapa: "menu", dados: {} });

    await sendText(
      telefone,
      "📍 *Menu Principal*\n\n1 — Comprar imóvel\n2 — Alugar imóvel\n3 — Vender imóvel"
    );

    return res.sendStatus(200);
  }

  // ===== MENU =====
  if (state.etapa === "menu") {
    await menuFlow(telefone, msg, state);
    return res.sendStatus(200);
  }

  // ===== COMPRA =====
  if (state.etapa.startsWith("compra_")) {
    await compraFlow(telefone, msg, state);
    return res.sendStatus(200);
  }

  // ===== ALUGUEL =====
  if (state.etapa.startsWith("alug_")) {
    await aluguelFlow(telefone, msg, state);
    return res.sendStatus(200);
  }

  // ===== VENDA =====
  if (state.etapa.startsWith("venda_")) {
    await vendaFlow(telefone, msg, state);
    return res.sendStatus(200);
  }

  // ===== FAIL SAFE =====
  updateState(telefone, { etapa: "menu", dados: {} });

  await sendText(
    telefone,
    "📍 *Menu Principal*\n\n1 — Comprar imóvel\n2 — Alugar imóvel\n3 — Vender imóvel"
  );

  return res.sendStatus(200);
});

module.exports = router;
