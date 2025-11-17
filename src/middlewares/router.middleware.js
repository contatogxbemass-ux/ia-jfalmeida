// src/middlewares/router.middleware.js

import { menuFlow } from "../flows/menu.flow.js";
import { compraFlow } from "../flows/compra.flow.js";
import { aluguelFlow } from "../flows/aluguel.flow.js";
import { vendaFlow } from "../flows/venda.flow.js";
import { listFlow } from "../flows/list.flow.js";

export const routerMiddleware = async (ctx, next) => {
  const state = ctx.state || {};

  // Se não tem etapa → vai para o menu automaticamente
  if (!state.etapa) {
    state.etapa = "menu";
    await ctx.setState(state);
  }

  const etapa = state.etapa;

  switch (etapa) {
    case "menu":
      return menuFlow(ctx, next);
    case "compra":
      return compraFlow(ctx, next);
    case "aluguel":
      return aluguelFlow(ctx, next);
    case "venda":
      return vendaFlow(ctx, next);
    case "list":
      return listFlow(ctx, next);
    default:
      state.etapa = "menu";
      await ctx.setState(state);
      return menuFlow(ctx, next);
  }
};
