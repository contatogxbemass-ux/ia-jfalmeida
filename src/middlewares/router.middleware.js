const menuFlow = require("../flows/menu.flow");
const compraFlow = require("../flows/compra.flow");
const aluguelFlow = require("../flows/aluguel.flow");
const vendaFlow = require("../flows/venda.flow");
const { showMainMenu } = require("../utils/menu.util");

module.exports = async (ctx, next) => {
  const state = ctx.state || {};
  const msg = ctx.body.trim();

  // Se não existe etapa → sempre abrir o menu
  if (!state.etapa) {
    await ctx.setState({ etapa: "menu" });
    await ctx.send(showMainMenu());
    return;
  }

  // Se está no menu
  if (state.etapa === "menu") {
    return menuFlow(ctx.from, msg, state, ctx);
  }

  // Rotas por fluxo
  if (state.etapa.startsWith("compra_")) {
    return compraFlow(ctx.from, msg, state, ctx);
  }

  if (state.etapa.startsWith("aluguel_")) {
    return aluguelFlow(ctx.from, msg, state, ctx);
  }

  if (state.etapa.startsWith("venda_")) {
    return vendaFlow(ctx.from, msg, state, ctx);
  }

  // QUALQUER COISA FORA DO FLUXO → VOLTA PARA O MENU SEM MENSAGEM
  await ctx.setState({ etapa: "menu" });
  await ctx.send(showMainMenu());
};
