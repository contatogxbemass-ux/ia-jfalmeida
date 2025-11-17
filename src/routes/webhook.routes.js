const express = require("express");
const router = express.Router();

const { getState, updateState, resetState } = require("../services/state.service");
const { sendText } = require("../services/zapi.service");

// FLOWS
const menuFlow = require("../flows/menu.flow");
const compraFlow = require("../flows/compra.flow");
const aluguelFlow = require("../flows/aluguel.flow");
const vendaFlow = require("../flows/venda.flow");

router.post("/", async (req, res) => {

  console.log("📩 RECEBIDO DO Z-API:", JSON.stringify(req.body, null, 2));

  const telefone = req.body.phone || req.body.connectedPhone;
  const msg = req.body.text?.message?.trim() || null;

  if (!telefone || !msg) return res.sendStatus(200);

  // BLOQUEIO ABSOLUTO DE GRUPOS
  if (req.body.isGroup || telefone.endsWith("@g.us") || telefone.includes("-group")) {
    console.log("⛔ Mensagem de grupo bloqueada");
    return res.sendStatus(200);
  }

  // ===== Buscar/Inicializar estado =====
  let state = getState(telefone);

  const messageId = req.body.messageId;
  if (state.lastMessageId === messageId) return res.sendStatus(200);

  updateState(telefone, { ...state, lastMessageId: messageId });

  const msgLower = msg.toLowerCase();

  // =======================
  // PAUSAR BOT
  // =======================
  if (msgLower === "/pausar") {
    updateState(telefone, { silencio: true });

    await sendText(
      telefone,
      "🔇 Atendimento automático pausado.\nPara reativar envie: /voltar"
    );

    return res.sendStatus(200);
  }

  // =======================
  // VOLTAR BOT
  // =======================
  if (msgLower === "/voltar") {
    updateState(telefone, { silencio: false });

    await sendText(
      telefone,
      "🔊 Atendimento automático reativado."
    );

    return res.sendStatus(200);
  }

  // =======================
  // SE PAUSADO → IGNORA TUDO
  // =======================
  if (state.silencio === true) {
    console.log("🔇 Cliente pausado. Ignorando mensagem.");
    return res.sendStatus(200);
  }

  // =======================
  // RESET DE MENU
  // =======================
  if (msgLower === "menu") {
    updateState(telefone, { etapa: "menu", dados: {} });

    await sendText(
      telefone,
`👋 Bem-vindo(a) à JF Almeida Imóveis!

🏡 IMÓVEIS
⿡ Comprar
⿢ Alugar

🏠 PROPRIETÁRIO
⿤ Vender imóvel
⿥ Colocar imóvel para aluguel

👤 HUMANO
⿠ Falar com corretor

Digite *menu* a qualquer momento.`
    );

    return res.sendStatus(200);
  }

  // =======================
  // FLUXO MENU
  // =======================
  if (state.etapa === "menu") {
    await menuFlow(telefone, msg, state);
    return res.sendStatus(200);
  }

  // =======================
  // FLUXO COMPRA
  // =======================
  if (state.etapa.startsWith("compra_")) {
    await compraFlow(telefone, msg, state);
    return res.sendStatus(200);
  }

  // =======================
  // FLUXO ALUGUEL
  // =======================
  if (state.etapa.startsWith("alug_")) {
    await aluguelFlow(telefone, msg, state);
    return res.sendStatus(200);
  }

  // =======================
  // FLUXO VENDA
  // =======================
  if (state.etapa.startsWith("venda_")) {
    await vendaFlow(telefone, msg, state);
    return res.sendStatus(200);
  }

  // =======================
  // FAIL SAFE → VOLTA MENU
  // =======================
  updateState(telefone, { etapa: "menu", dados: {} });

  await sendText(
    telefone,
`👋 Bem-vindo(a) à JF Almeida Imóveis!

🏡 IMÓVEIS
⿡ Comprar
⿢ Alugar

🏠 PROPRIETÁRIO
⿤ Vender imóvel
⿥ Colocar imóvel para aluguel

👤 HUMANO
⿠ Falar com corretor

Digite *menu* a qualquer momento.`
  );

  return res.sendStatus(200);
});

module.exports = router;
