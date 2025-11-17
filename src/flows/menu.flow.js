const { sendText } = require("../services/zapi.service");
const { updateState } = require("../services/state.service");

module.exports = async function menuFlow(telefone, msg, state) {
  const op = msg.trim();

  switch (op) {
    case "1":
      updateState(telefone, { etapa: "compra_tipo", dados: {} });
      return sendText(
        telefone,
        "Perfeito! Qual *tipo de imóvel* você deseja comprar?"
      );

    case "2":
      updateState(telefone, { etapa: "alug_cliente_tipo", dados: {} });
      return sendText(
        telefone,
        "Ótimo! Qual *tipo de imóvel* você deseja alugar?"
      );

    case "3":
      updateState(telefone, { etapa: "venda_tipo", dados: {} });
      return sendText(
        telefone,
        "Certo! Qual *tipo de imóvel* você deseja vender?"
      );

    case "0":
      updateState(telefone, {
        etapa: "aguardando_corretor",
        dados: {},
      });
      return sendText(
        telefone,
        "📞 Encaminhando para um corretor humano.\n\nEnvie:\n• Seu nome\n• Melhor horário\n• Assunto"
      );

    default:
      return sendText(
        telefone,
        "Opção inválida.\n\nDigite:\n1 — Comprar\n2 — Alugar\n3 — Vender\n0 — Corretor"
      );
  }
};
