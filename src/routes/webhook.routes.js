const express = require("express");
const router = express.Router();
const { getState, updateState } = require("../services/state.service");
const { sendText } = require("../services/zapi.service");
const gerarResumoIA = require("../services/openai.service");

router.post("/", async (req, res) => {
  console.log("📩 RECEBIDO DO Z-API:", JSON.stringify(req.body, null, 2));

  const raw = req.body;
  const telefone = raw.phone || raw.connectedPhone;

  // Bloqueio total para grupos
  if (raw.isGroup || telefone.includes("-group") || telefone.endsWith("@g.us")) {
    return res.sendStatus(200);
  }

  const texto = raw?.text?.message || null;
  const messageId = raw.messageId;

  if (!telefone || !texto) return res.sendStatus(200);

  // Carregar estado
  let estado = getState(telefone);

  // Anti-duplicidade
  if (estado.lastMessageId === messageId) {
    return res.sendStatus(200);
  }
  updateState(telefone, { lastMessageId: messageId });

  const msg = texto.trim();
  const msgLower = msg.toLowerCase();

  // COMANDOS ADMINISTRATIVOS
  if (msgLower === "/pausar") {
    updateState(telefone, { silencio: true });
    await sendText(telefone, "🤫 Atendimento automático pausado.");
    return res.sendStatus(200);
  }

  if (msgLower === "/voltar") {
    updateState(telefone, { silencio: false, etapa: "menu", dados: {} });
    await sendText(telefone, "🔊 Atendimento automático reativado.");
    await sendText(telefone, menuPrincipal());
    return res.sendStatus(200);
  }

  if (estado.silencio) return res.sendStatus(200);

  // RESET MANUAL
  if (msgLower === "menu") {
    updateState(telefone, { etapa: "menu", dados: {} });
    await sendText(telefone, menuPrincipal());
    return res.sendStatus(200);
  }

  // =============================
  // MENU PRINCIPAL
  // =============================
  if (estado.etapa === "menu") {
    switch (msg) {
      case "1":
        updateState(telefone, { etapa: "compra_tipo", dados: {} });
        await sendText(telefone, "Ótimo! Qual *tipo de imóvel* você procura?");
        return res.sendStatus(200);

      case "2":
        updateState(telefone, { etapa: "alug_cliente_tipo", dados: {} });
        await sendText(telefone, "Perfeito! Qual *tipo de imóvel* você quer alugar?");
        return res.sendStatus(200);

      case "3":
        updateState(telefone, { etapa: "list_tipo", dados: {} });
        await sendText(telefone, "Certo! Qual *tipo de imóvel* você quer ver?");
        return res.sendStatus(200);

      case "4":
        updateState(telefone, { etapa: "venda_tipo", dados: {} });
        await sendText(telefone, "Ok! Qual *tipo de imóvel* você quer vender?");
        return res.sendStatus(200);

      case "5":
        updateState(telefone, { etapa: "alug_prop_tipo", dados: {} });
        await sendText(telefone, "Certo! Qual *tipo de imóvel* você quer colocar para aluguel?");
        return res.sendStatus(200);

      default:
        await sendText(telefone, "Opção inválida. Digite uma opção do menu.\n\n" + menuPrincipal());
        return res.sendStatus(200);
    }
  }

  return res.sendStatus(200);
});

// MENU
function menuPrincipal() {
  return `
👋 *Bem-vindo(a) à JF Almeida Imóveis!*

🏡 *IMÓVEIS*
1️⃣ Comprar
2️⃣ Alugar

🏠 *PROPRIETÁRIO*
3️⃣ Ver imóveis
4️⃣ Vender imóvel
5️⃣ Colocar imóvel para aluguel

Digite *menu* a qualquer momento.
`;
}

module.exports = router;
