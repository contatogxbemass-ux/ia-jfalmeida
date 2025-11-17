const menuFlow = require("../flows/menu.flow");
const compraFlow = require("../flows/compra.flow");
const aluguelFlow = require("../flows/aluguel.flow");
const vendaFlow = require("../flows/venda.flow");

module.exports = async (ctx, next) => {
  const state = ctx.state || {};
  const msg = ctx.body;

  if (!state.etapa || state.etapa === "menu") {
    return menuFlow(ctx.from, msg, state, ctx);
  }

  if (state.etapa.startsWith("compra_")) {
    return compraFlow(ctx.from, msg, state, ctx);
  }

  if (state.etapa.startsWith("aluguel_")) {
    return aluguelFlow(ctx.from, msg, state, ctx);
  }

  if (state.etapa.startsWith("venda_")) {
    return vendaFlow(ctx.from, msg, state, ctx);
  }

  await ctx.send("Não entendi. Digite *menu*.");
  await ctx.resetState();
};
