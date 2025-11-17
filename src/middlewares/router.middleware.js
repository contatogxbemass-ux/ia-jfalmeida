import { getSession, updateSession } from "../services/redis.service.js";
import { sendText } from "../services/zapi.service.js";

import menuFlow from "../flows/menu.flow.js";
import compraFlow from "../flows/compra.flow.js";
import aluguelFlow from "../flows/aluguel.flow.js";
import vendaFlow from "../flows/venda.flow.js";
import listFlow from "../flows/list.flow.js";

async function routerMiddleware(req, res, next) {
  try {
    const phone = req.body?.phone;
    const msg = req.body?.text?.message;

    if (!phone || !msg) return next();

    const session = await getSession(phone);

    const replies = [];

    const ctx = {
      from: phone,
      message: msg,

      async send(text) {
        replies.push(text);
        await sendText(phone, text); // ENVIA direto no WhatsApp
      },

      async setState(data) {
        await updateSession(phone, data);
      }
    };

    switch (session.etapa) {
      case "menu":
        await menuFlow(ctx);
        break;
      case "compra":
        await compraFlow(ctx);
        break;
      case "aluguel":
        await aluguelFlow(ctx);
        break;
      case "venda":
        await vendaFlow(ctx);
        break;
      case "lista":
        await listFlow(ctx);
        break;
      default:
        await menuFlow(ctx);
        break;
    }

    return res.json({ ok: true, replies });
  } catch (err) {
    console.log("Erro no routerMiddleware:", err);
    return res.json({ ok: false });
  }
}

export default routerMiddleware;
