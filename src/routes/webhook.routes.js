const express = require("express");
const router = express.Router();

const { initState, getState, updateState } = require("../services/state.service");
const { sendMessage } = require("../services/zapi.service");
const { menuPrincipalFlow } = require("../flows/menu.flow");

const compraFlow = require("../flows/compra.flow");
const vendaFlow = require("../flows/venda.flow");
const alugClienteFlow = require("../flows/alug_cliente.flow");
const alugPropFlow = require("../flows/alug_prop.flow");


// ======================================================
// 🔥 WEBHOOK Z-API COMPLETO (VERSÃO FINAL)
// ======================================================
router.post("/webhook", async (req, res) => {
  console.log("📩 RECEBIDO DO Z-API:", JSON.stringify(req.body, null, 2));

  // -----------------------
  // TELEFONE
  // -----------------------
  const phone = req.body.phone || req.body.connectedPhone;

  // -----------------------
  // BLOQUEIO TOTAL DE GRUPOS
  // -----------------------
  if (
    req.body.isGroup === true ||
    (phone && phone.includes("-group")) ||
    (phone && phone.endsWith("@g.us"))
  ) {
    console.log("⛔ BLOQUEADO: Mensagem de grupo ignorada.");
    return res.sendStatus(200);
  }

  // -----------------------
  // TEXTO NORMAL
  // -----------------------
  const texto = req.body?.text?.message || "";
  const msg = texto.trim();
  const lower = msg.toLowerCase();

  // -----------------------
  // INICIALIZA ESTADO
  // -----------------------
  let state = getState(phone);
  if (!state) state = initState(phone);

  // -----------------------
  // ANTI-DUPLICIDADE
  // -----------------------
  const messageId = req.body.messageId;
  if (state.lastMessageId === messageId) {
    return res.sendStatus(200);
  }
  updateState(phone, { lastMessageId: messageId });

  // ======================================================
  // 🔥 BOTÃO PRESSIONADO (NÚMEROS 1–5 e 0)
  // ======================================================
  const buttonId = req.body.buttonResponse && req.body.buttonResponse.id;

  if (buttonId) {
    console.log("🔘 BOTÃO PRESSIONADO:", buttonId);

    switch (buttonId) {
      case "1":
        updateState(phone, { etapa: "compra_tipo", dados: {} });
        await sendMessage(phone, "Qual tipo de imóvel deseja comprar?");
        return res.sendStatus(200);

      case "2":
        updateState(phone, { etapa: "alug_cliente_tipo", dados: {} });
        await sendMessage(phone, "Qual tipo de imóvel deseja alugar?");
        return res.sendStatus(200);

      case "3":
        updateState(phone, { etapa: "list_tipo", dados: {} });
        await sendMessage(phone, "Qual tipo de imóvel deseja ver?");
        return res.sendStatus(200);

      case "4":
        updateState(phone, { etapa: "venda_tipo", dados: {} });
        await sendMessage(phone, "Qual tipo de imóvel deseja vender?");
        return res.sendStatus(200);

      case "5":
        updateState(phone, { etapa: "alug_prop_tipo", dados: {} });
        await sendMessage(phone, "Qual tipo de imóvel deseja colocar para aluguel?");
        return res.sendStatus(200);

      case "0":
        updateState(phone, { etapa: "aguardando_corretor", dados: {} });
        await sendMessage(phone, "Perfeito! Um corretor humano irá te chamar em instantes.");
        return res.sendStatus(200);
    }
  }

  // ======================================================
  // 🔥 COMANDO GLOBAL "menu"
  // ======================================================
  if (lower === "menu") {
    updateState(phone, { etapa: "menu", dados: {} });
    await menuPrincipalFlow(phone);
    return res.sendStatus(200);
  }

  // ======================================================
  // 🔥 Direcionar para o fluxo certo
  // ======================================================

  // MENU PRINCIPAL
  if (state.etapa === "menu") {
    await menuPrincipalFlow(phone);
    return res.sendStatus(200);
  }

  // COMPRA
  if (state.etapa.startsWith("compra_")) {
    await compraFlow(phone, msg, state);
    return res.sendStatus(200);
  }

  // VENDA
  if (state.etapa.startsWith("venda_")) {
    await vendaFlow(phone, msg, state);
    return res.sendStatus(200);
  }

  // ALUGAR CLIENTE
  if (state.etapa.startsWith("alug_cliente_")) {
    await alugClienteFlow(phone, msg, state);
    return res.sendStatus(200);
  }

  // ALUGAR PROPRIETÁRIO
  if (state.etapa.startsWith("alug_prop_")) {
    await alugPropFlow(phone, msg, state);
    return res.sendStatus(200);
  }

  // ======================================================
  // 🔥 Se cair aqui, reseta para o menu
  // ======================================================
  await sendMessage(phone, "Não entendi sua mensagem. Digite *menu*.");
  updateState(phone, { etapa: "menu", dados: {} });

  return res.sendStatus(200);
});


// ======================================================
// EXPORTAÇÃO
// ======================================================
module.exports = router;
