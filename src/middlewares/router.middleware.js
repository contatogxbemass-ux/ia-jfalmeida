const menuFlow = require("../flows/menu.flow");
const compraFlow = require("../flows/compra.flow");
const aluguelFlow = require("../flows/aluguel.flow");
const vendaFlow = require("../flows/venda.flow");
const listFlow = require("../flows/list.flow");

module.exports = async function routerMiddleware(ctx, next) {
  const { state, phone, msg } = ctx;

  // MENU
  if (state.etapa === "menu") {
    await menuFlow(phone, msg, state);
    return;
  }

  // COMPRA
  if (state.etapa.startsWith("compra_")) {
    await compraFlow(phone, msg, state);
    return;
  }

  // ALUGUEL (cliente + proprietário)
  if (state.etapa.startsWith("alug_")) {
    await aluguelFlow(phone, msg, state);
    return;
  }

  // VENDA
  if (state.etapa.startsWith("venda_")) {
    await vendaFlow(phone, msg, state);
    return;
  }

  // LISTAGEM
  if (state.etapa.startsWith("list_")) {
    await listFlow(phone, msg, state);
    return;
  }

  // Fallback
  await ctx.send("Não entendi. Digite *menu*.");
  await ctx.resetState();
  return;
};
