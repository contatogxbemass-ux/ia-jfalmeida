const { showMainMenu } = require("../utils/menu.util");

module.exports = async function menuFlow(from, msg, state, ctx) {
  msg = msg.trim();

  // Forçando entrada do menu quando usuário digita "menu"
  if (msg.toLowerCase() === "menu") {
    await ctx.setState({ etapa: "menu" });
    return ctx.send(showMainMenu());
  }

  switch (msg) {
    case "1":
      await ctx.setState({ etapa: "compra_inicio" });
      return ctx.send("Perfeito! Vamos iniciar o atendimento de compra.\n\nQual cidade você procura o imóvel?");

    case "2":
      await ctx.setState({ etapa: "aluguel_inicio" });
      return ctx.send("Ótimo! Vamos iniciar o atendimento de aluguel.\n\nQual cidade você procura o imóvel?");

    case "4":
      await ctx.setState({ etapa: "venda_inicio" });
      return ctx.send("Vamos avaliar seu imóvel para venda.\n\nQual o endereço do imóvel?");

    case "5":
      await ctx.setState({ etapa: "venda_inicio" });
      return ctx.send("Vamos iniciar o processo de colocar o imóvel para aluguel.\n\nQual o endereço do imóvel?");

    case "0":
      await ctx.setState({ etapa: "humano" });
      return ctx.send("Certo! Encaminhando você para um corretor humano.");

    default:
      // Usuário mandou algo fora do menu → volta ao menu, sem erro
      await ctx.setState({ etapa: "menu" });
      return ctx.send(showMainMenu());
  }
};