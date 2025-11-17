const menuFlow = require("../flows/menu.flow");
const compraFlow = require("../flows/compra.flow");
const aluguelFlow = require("../flows/aluguel.flow");
const vendaFlow = require("../flows/venda.flow");
const { showMainMenu } = require("../utils/menu.util");

module.exports = async (ctx, next) => {
  const msg = ctx.body?.trim();
  const state = ctx.state || {};

  // Se não existe etapa → inicia no menu imediatamente
  if (!state.etapa) {
    await ctx.setState({ etapa: "menu" });
    await ctx.send(showMainMenu());
    return;
  }

  // MENU
  if (state.etapa === "menu") {
    return menuFlow(ctx.from, msg, state, ctx);
  }

  // COMPRA
  if (state.etapa.startsWith("compra_")) {
    return compraFlow(ctx.from, msg, state, ctx);
  }

  // ALUGUEL
  if (state.etapa.startsWith("aluguel_")) {
    return aluguelFlow(ctx.from, msg, state, ctx);
  }

  // VENDA
  if (state.etapa.startsWith("venda_")) {
    return vendaFlow(ctx.from, msg, state, ctx);
  }

  // QUALQUER OUTRA COISA → VOLTA PRO MENU
  await ctx.setState({ etapa: "menu" });
  await ctx.send(showMainMenu());
};
