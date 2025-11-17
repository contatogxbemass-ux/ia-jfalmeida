const { sendText } = require("../services/zapi.service");
const { updateSession } = require("../services/redis.service");
const { showMainMenu } = require("../utils/menu.util");

module.exports = async function menuFlow(telefone, msg, state) {
  const op = msg.trim();

  switch (op) {
    case "1":
      await updateSession(telefone, {
        etapa: "compra_tipo",
        fluxo: "Compra de Imóvel",
        telefone,
        dadosColetados: {}
      });
      return sendText(
        telefone,
        "Perfeito! Qual *tipo de imóvel* você deseja comprar?"
      );

    case "2":
      await updateSession(telefone, {
        etapa: "alug_cliente_tipo",
        fluxo: "Aluguel - Cliente",
        telefone,
        dadosColetados: {}
      });
      return sendText(
        telefone,
        "Ótimo! Qual *tipo de imóvel* você deseja alugar?"
      );

    case "3":
      await updateSession(telefone, {
        etapa: "venda_tipo",
        fluxo: "Venda de Imóvel",
        telefone,
        dadosColetados: {}
      });
      return sendText(
        telefone,
        "Certo! Qual *tipo de imóvel* você deseja vender?"
      );

    case "4":
      await updateSession(telefone, {
        etapa: "alug_prop_tipo",
        fluxo: "Aluguel - Proprietário",
        telefone,
        dadosColetados: {}
      });
      return sendText(
        telefone,
        "Vamos anunciar seu imóvel para aluguel.\n\nQual o *tipo de imóvel*?"
      );

    case "0":
      await updateSession(telefone, {
        etapa: "aguardando_corretor",
        fluxo: "Atendimento humano",
        telefone,
        dadosColetados: {}
      });
      return sendText(
        telefone,
        "📞 Encaminhando para um corretor humano.\n\nEnvie:\n• Seu nome\n• Melhor horário\n• Assunto"
      );

    default:
      return sendText(
        telefone,
        "Opção inválida.\n\n" + showMainMenu()
      );
  }
};
