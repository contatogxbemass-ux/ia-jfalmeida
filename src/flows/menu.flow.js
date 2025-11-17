const { showMainMenu } = require("../utils/menu.util");

module.exports = async function menuFlow(phone, msg, state, ctx) {
  const option = msg.trim();

  // MENU PRINCIPAL
  if (!state.etapa || state.etapa === "menu") {
    if (option === "1") {
      await ctx.setState({
        etapa: "compra_inicio",
        fluxo: "Compra",
        telefone: phone,
        dados: {}
      });

      await ctx.send("Perfeito! Vamos começar seu atendimento de COMPRA.\nQual cidade deseja?");
      return;
    }

    if (option === "2") {
      await ctx.setState({
        etapa: "aluguel_inicio",
        fluxo: "Aluguel",
        telefone: phone,
        dados: {}
      });

      await ctx.send("Vamos iniciar seu atendimento de ALUGUEL.\nQual cidade deseja?");
      return;
    }

    if (option === "4") {
      await ctx.setState({
        etapa: "venda_inicio",
        fluxo: "Venda",
        telefone: phone,
        dados: {}
      });

      await ctx.send("Vamos começar a AVALIAÇÃO DE VENDA.\nInforme a cidade:");
      return;
    }

    if (option === "5") {
      await ctx.setState({
        etapa: "alugar_proprietario_inicio",
        fluxo: "Alugar - Proprietário",
        telefone: phone,
        dados: {}
      });

      await ctx.send("Vamos anunciar seu imóvel para ALUGAR.\nQual cidade?");
      return;
    }

    if (option === "0") {
      await ctx.setState({ etapa: "humano", fluxo: "Humano", telefone: phone });
      await ctx.send("Encaminhando para um corretor...\nAguarde alguns instantes.");
      return;
    }

    await ctx.send("Opção inválida.\n\n" + showMainMenu());
    return;
  }

  // FALLBACK (qualquer etapa inválida volta ao menu)
  await ctx.send(showMainMenu());
};
