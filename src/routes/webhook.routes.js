const express = require("express");
const router = express.Router();

const { getState, updateState } = require("../services/state.service");
const { sendMessage, sendButtons } = require("../services/zapi.service");
const { iaResumo } = require("../services/openai.service");

// FLOWS QUE EXISTEM NO SEU PROJETO
const menuFlow = require("../flows/menu.flow");
const compraFlow = require("../flows/compra.flow");
const aluguelFlow = require("../flows/aluguel.flow");
const vendaFlow = require("../flows/venda.flow");

// =========================
// WEBHOOK ISOLADO
// =========================
router.post("/webhook", async (req, res) => {
  try {
    const body = req.body;
    const telefone = body.phone;
    const texto = body?.text?.message || null;
    const buttonId = body?.buttonResponse?.id || null;

    // Bloqueio total de grupos
    if (body.isGroup || telefone.includes("-group") || telefone.endsWith("@g.us")) {
      console.log("⛔ BLOQUEADO: grupo detectado");
      return res.sendStatus(200);
    }

    // Ignorar mensagens sem texto
    if (!texto && !buttonId) return res.sendStatus(200);

    // Estado do usuário
    let state = getState(telefone);

    // ============================
    // BOTÃO PRESSIONADO
    // ============================
    if (buttonId) {
      console.log("🔘 BOTÃO:", buttonId);

      switch (buttonId) {
        case "1":
          updateState(telefone, { etapa: "compra_tipo", dados: {} });
          await sendMessage(telefone, "Qual tipo de imóvel deseja comprar?");
          return res.sendStatus(200);

        case "2":
          updateState(telefone, { etapa: "alug_cliente_tipo", dados: {} });
          await sendMessage(telefone, "Qual tipo de imóvel deseja alugar?");
          return res.sendStatus(200);

        case "3":
          updateState(telefone, { etapa: "lista_tipo", dados: {} });
          await sendMessage(telefone, "Qual tipo de imóvel deseja ver?");
          return res.sendStatus(200);

        case "4":
          updateState(telefone, { etapa: "venda_tipo", dados: {} });
          await sendMessage(telefone, "Qual tipo de imóvel deseja vender?");
          return res.sendStatus(200);

        case "5":
          // Você AINDA NÃO TEM fluxo de aluguel do proprietário
          await sendMessage(telefone, "Fluxo de proprietário ainda não disponível.");
          return res.sendStatus(200);

        case "0":
          updateState(telefone, { etapa: "aguardando_corretor", dados: {} });
          await sendMessage(
            telefone,
            "Perfeito! Um corretor humano irá te chamar em instantes."
          );
          return res.sendStatus(200);
      }
    }

    // Texto normal enviado
    const msg = texto.trim().toLowerCase();

    // Reset para MENU
    if (msg === "menu") {
      updateState(telefone, { etapa: "menu", dados: {} });
      await menuFlow(telefone);
      return res.sendStatus(200);
    }

    // EXECUTAR O FLUXO CORRETO
    switch (state.etapa) {
      case "menu":
        return menuFlow(telefone);

      case "compra_tipo":
      case "compra_regiao":
      case "compra_orcamento":
      case "compra_pagamento":
      case "compra_urgencia":
        return compraFlow(telefone, texto, state);

      case "alug_cliente_tipo":
      case "alug_cliente_regiao":
      case "alug_cliente_orcamento":
      case "alug_cliente_quartos":
      case "alug_cliente_data":
      case "alug_cliente_finalidade":
        return aluguelFlow(telefone, texto, state);

      case "venda_tipo":
      case "venda_local":
      case "venda_tamanho":
      case "venda_estado":
      case "venda_valor":
        return vendaFlow(telefone, texto, state);

      default:
        updateState(telefone, { etapa: "menu", dados: {} });
        return menuFlow(telefone);
    }
  } catch (err) {
    console.error("ERRO NO WEBHOOK:", err);
    return res.sendStatus(200);
  }
});

module.exports = router;
