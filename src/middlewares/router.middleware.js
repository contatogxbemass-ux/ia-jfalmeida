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

  // Menu
  if (state.etapa === "menu") {
    return menuFlow(ctx.from, msg, state, ctx);
  }

  // Fluxos
  if (state.etapa.startsWith("compra_")) {
    return compraFlow(ctx.from, msg, state, ctx);
  }

  if (state.etapa.startsWith("aluguel_")) {
    return aluguelFlow(ctx.from, msg, state, ctx);
  }

  if (state.etapa.startsWith("venda_")) {
    return vendaFlow(ctx.from, msg, state, ctx);
  }

  // Qualquer coisa fora → volta pro menu
  await ctx.setState({ etapa: "menu" });
  await ctx.send(showMainMenu());
};
