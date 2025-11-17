import { getSession } from "../services/redis.service.js";
import menuFlow from "../flows/menu.flow.js";
import compraFlow from "../flows/compra.flow.js";
import aluguelFlow from "../flows/aluguel.flow.js";
import vendaFlow from "../flows/venda.flow.js";
import listFlow from "../flows/list.flow.js";

async function routerMiddleware(req, res, next) {
  try {
    const body = req.body;
    const phone = body?.phone;
    const msg = body?.text?.message;

    if (!phone || !msg) return next();

    const session = await getSession(phone);

    const ctx = {
      from: phone,
      message: msg,
      send: (txt) => res.json({ reply: txt }),
      setState: async (state) => updateSession(phone, state),
    };

    switch (session.etapa) {
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
  } catch (err) {
    console.log("Erro no routerMiddleware:", err);
    next();
  }
}

export default routerMiddleware;
