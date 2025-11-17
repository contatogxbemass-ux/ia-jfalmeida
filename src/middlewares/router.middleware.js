// src/middlewares/router.middleware.js

import aluguelFlow from "../flows/aluguel.flow.js";
import compraFlow from "../flows/compra.flow.js";
import vendaFlow from "../flows/venda.flow.js";
import listFlow from "../flows/list.flow.js";
import menuFlow from "../flows/menu.flow.js";

export const routerMiddleware = async (ctx, next) => {
  const state = ctx.state;

  if (!state || !state.etapa) {
    return menuFlow(ctx);
  }

  switch (state.etapa) {
    case "menu":
      return menuFlow(ctx);

    case "compra":
      return compraFlow(ctx);

    case "aluguel":
      return aluguelFlow(ctx);

    case "venda":
      return vendaFlow(ctx);

    case "lista":
      return listFlow(ctx);

    default:
      return menuFlow(ctx);
  }
};
