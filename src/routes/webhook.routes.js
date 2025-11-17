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

  // ==================================================
  // CAPTURA SEGURA DO TELEFONE
  // ==================================================
  const telefone = req.body.phone || req.body.connectedPhone;
  if (!telefone) return res.sendStatus(200);

  // ==================================================
  // CAPTURA SEGURA DA MENSAGEM — CORREÇÃO CRÍTICA
  // ==================================================
  let msg = req.body.text?.message;

  // Se vier como objeto (botão, estrutura Z-API, select, etc)
  if (typeof msg === "object" && msg !== null) {
    msg =
      msg.id ||
      msg.title ||
      msg.text ||
      msg.value ||
      msg.label ||
      ""; // fallback
  }

  // Garante string limpa
  if (typeof msg === "string") {
    msg = msg.trim();
  } else {
    msg = "";
  }

  if (!msg) return res.sendStatus(200);

  // ==================================================
  // BLOQUEIO ABSOLUTO DE GRUPO
  // ==================================================
  if (
    req.body.isGroup ||
    telefone.includes("-group") ||
    telefone.endsWith("@g.us")
  ) {
    console.log("⛔ Mensagem de grupo bloqueada:", telefone);
    return res.sendStatus(200);
  }

  // ==================================================
  // ESTADO DO USUÁRIO
  // ==================================================
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

  // ==================================================
  // ANTI-DUPLICIDADE
  // ==================================================
  const messageId = req.body.messageId;
  if (state.lastMessageId === messageId) {
    console.log("🔁 Mensagem duplicada ignorada");
    return res.sendStatus(200);
  }
  updateState(telefone, { ...state, lastMessageId: messageId });

  const msgLower = msg.toLowerCase();

  // ==================================================
  // RESET PARA MENU
  // ==================================================
  if (msgLower === "menu") {
    updateState(telefone, { etapa: "menu", dados: {} });

    await sendText(
      telefone,
      "📍 *Menu Principal*\n\n1 — Comprar imóvel\n2 — Alugar imóvel\n3 — Vender imóvel"
    );

    return res.sendStatus(200);
  }

  // ==================================================
  // MENU
  // ==================================================
  if (state.etapa === "menu") {
    await menuFlow(telefone, msg, state);
    return res.sendStatus(200);
  }

  // ==================================================
  // COMPRA
  // ==================================================
  if (state.etapa.startsWith("compra_")) {
    await compraFlow(telefone, msg, state);
    return res.sendStatus(200);
  }

  // ==================================================
  // ALUGUEL
  // ==================================================
  if (state.etapa.startsWith("alug_")) {
    await aluguelFlow(telefone, msg, state);
    return res.sendStatus(200);
  }

  // ==================================================
  // VENDA
  // ==================================================
  if (state.etapa.startsWith("venda_")) {
    await vendaFlow(telefone, msg, state);
    return res.sendStatus(200);
  }

  // ==================================================
  // FAIL-SAFE
  // ==================================================
  updateState(telefone, { etapa: "menu", dados: {} });

  await sendText(
    telefone,
    "📍 *Menu Principal*\n\n1 — Comprar imóvel\n2 — Alugar imóvel\n3 — Vender imóvel"
  );

  return res.sendStatus(200);
});

module.exports = router;