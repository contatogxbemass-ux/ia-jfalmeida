const express = require("express");
const router = express.Router();

const { getState, updateState } = require("../services/state.service");
const { sendText } = require("../services/zapi.service");

// FLOWS
const menuFlow = require("../flows/menu.flow");
const compraFlow = require("../flows/compra.flow");
const aluguelFlow = require("../flows/aluguel.flow");
const vendaFlow = require("../flows/venda.flow");

// ===============================
// MENU PRINCIPAL
// ===============================
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

// ===============================
// WEBHOOK
// ===============================
router.post("/", async (req, res) => {

  console.log("📩 RECEBIDO DO Z-API:", JSON.stringify(req.body, null, 2));

  const telefone = req.body.phone || req.body.connectedPhone;
  const msg = req.body.text?.message?.trim() || null;

  if (!telefone || !msg) return res.sendStatus(200);

  // Bloqueio de grupos
  if (req.body.isGroup || telefone.endsWith("@g.us") || telefone.includes("-group")) {
    console.log("⛔ Mensagem de grupo bloqueada");
    return res.sendStatus(200);
  }

  // Carregar estado
  let state = getState(telefone);

  // Primeiro contato
  if (!state.lastMessageId) {
    updateState(telefone, { etapa: "menu", dados: {}, lastMessageId: null });

    await sendText(telefone, menuPrincipal());
    return res.sendStatus(200);
  }

  // Anti-duplicidade
  const messageId = req.body.messageId;
  if (state.lastMessageId === messageId) return res.sendStatus(200);
  updateState(telefone, { ...state, lastMessageId: messageId });

  const msgLower = msg.toLowerCase();

  // Comando menu
  if (msgLower === "menu") {
    updateState(telefone, { etapa: "menu", dados: {} });
    await sendText(telefone, menuPrincipal());
    return res.sendStatus(200);
  }

  // MENU
  if (state.etapa === "menu") {
    await menuFlow(telefone, msg, state);
    return res.sendStatus(200);
  }

  // COMPRA
  if (state.etapa.startsWith("compra_")) {
    await compraFlow(telefone, msg, state);
    return res.sendStatus(200);
  }

  // ALUGUEL
  if (state.etapa.startsWith("alug_")) {
    await aluguelFlow(telefone, msg, state);
    return res.sendStatus(200);
  }

  // VENDA
  if (state.etapa.startsWith("venda_")) {
    await vendaFlow(telefone, msg, state);
    return res.sendStatus(200);
  }

  // Fail-safe
  updateState(telefone, { etapa: "menu", dados: {} });
  await sendText(telefone, menuPrincipal());
  return res.sendStatus(200);
});

module.exports = router;
