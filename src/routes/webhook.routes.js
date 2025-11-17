const express = require("express");
const router = express.Router();

const { getSession, updateSession, resetSession } = require("../services/redis.service");
const { sendText } = require("../services/zapi.service");

const menuFlow = require("../flows/menu.flow");
const compraFlow = require("../flows/compra.flow");
const aluguelFlow = require("../flows/aluguel.flow");
const vendaFlow = require("../flows/venda.flow");

const { menuPrincipal } = require("../utils/menu.util");

// ======================================================
// 🔥 WEBHOOK PRINCIPAL (VERSÃO FINAL COM REDIS)
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

  // Carrega sessão
  let state = await getSession(telefone);

  // Anti duplicidade
  const messageId = req.body.messageId;
  if (state.lastMessageId === messageId) return res.sendStatus(200);
  state = await updateSession(telefone, { lastMessageId: messageId });

  const msgLower = msg.toLowerCase();

  // ======================================================
  // 🔥 COMANDOS GLOBAIS (Redis)
  // ======================================================

  if (msgLower === "/pausar") {
    await updateSession(telefone, { paused: true });
    await sendText(telefone, "⏸️ Bot pausado. Digite /voltar para continuar.");
    return res.sendStatus(200);
  }

  if (msgLower === "/voltar") {
    await updateSession(telefone, { paused: false });
    await sendText(telefone, "▶️ Bot retomado.");
    return res.sendStatus(200);
  }

  if (msgLower === "menu" || msgLower === "/menu") {
    await resetSession(telefone);
    await sendText(telefone, menuPrincipal());
    return res.sendStatus(200);
  }

  // Se estiver pausado, bloqueia tudo
  if (state.paused) {
    await sendText(telefone, "⏸️ Bot pausado. Digite /voltar para continuar.");
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
  // 🔥 FLUXOS
  // ======================================================

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

  // ======================================================
  // 🔥 FAIL SAFE
  // ======================================================
  await sendText(telefone, "Não entendi. Digite *menu*.");
  await resetSession(telefone);

  return res.sendStatus(200);
});

module.exports = router;
