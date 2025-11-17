import express from "express";
import { getSession, updateSession, resetSession } from "../services/redis.service.js";
import { sendText } from "../services/zapi.service.js";

import menuFlow from "../flows/menu.flow.js";
import compraFlow from "../flows/compra.flow.js";
import aluguelFlow from "../flows/aluguel.flow.js";
import vendaFlow from "../flows/venda.flow.js";
import listFlow from "../flows/list.flow.js";

import showMainMenu from "../utils/menu.util.js";

const router = express.Router();

// ======================================================
// 🔥 WEBHOOK PRINCIPAL
// ======================================================
router.post("/", async (req, res) => {
  console.log("📩 RECEBIDO DO Z-API:", JSON.stringify(req.body, null, 2));

  const telefone = req.body.phone || req.body.connectedPhone;
  const messageId = req.body.messageId;
  const msg = req.body.text?.message?.trim() || "";

  if (!telefone || !msg) return res.sendStatus(200);

  if (req.body.isGroup || telefone.includes("-group")) {
    return res.sendStatus(200);
  }

  let state = await getSession(telefone);

  // Anti duplicidade
  if (state?.lastMessageId === messageId) return res.sendStatus(200);

  state = await updateSession(telefone, { lastMessageId: messageId });

  const msgLower = msg.toLowerCase();

  // COMANDOS
  if (msgLower === "/pausar") {
    await updateSession(telefone, { paused: true });
    return res.sendStatus(200);
  }

  if (msgLower === "/voltar") {
    await updateSession(telefone, { paused: false });
    await sendText(telefone, "▶️ Bot retomado.");
    return res.sendStatus(200);
  }

  if (state.paused) return res.sendStatus(200);

  if (msgLower === "menu") {
    await resetSession(telefone);
    await sendText(telefone, showMainMenu());
    return res.sendStatus(200);
  }

  // MENU
  if (state.etapa === "menu") {
    await menuFlow({
      from: telefone,
      message: msg,
      send: (text) => sendText(telefone, text),
      setState: (data) => updateSession(telefone, data),
    });
    return res.sendStatus(200);
  }

  // FLUXOS
  if (state.etapa === "compra") {
    await compraFlow({
      from: telefone,
      message: msg,
      send: (text) => sendText(telefone, text),
      setState: (data) => updateSession(telefone, data),
    });
    return res.sendStatus(200);
  }

  if (state.etapa === "aluguel") {
    await aluguelFlow({
      from: telefone,
      message: msg,
      send: (text) => sendText(telefone, text),
      setState: (data) => updateSession(telefone, data),
    });
    return res.sendStatus(200);
  }

  if (state.etapa === "venda") {
    await vendaFlow({
      from: telefone,
      message: msg,
      send: (text) => sendText(telefone, text),
      setState: (data) => updateSession(telefone, data),
    });
    return res.sendStatus(200);
  }

  if (state.etapa === "lista") {
    await listFlow({
      from: telefone,
      message: msg,
      send: (text) => sendText(telefone, text),
      setState: (data) => updateSession(telefone, data),
    });
    return res.sendStatus(200);
  }

  // FAILSAFE
  await sendText(telefone, "Não entendi. Digite *menu*.");
  await resetSession(telefone);

  return res.sendStatus(200);
});

export default router;
