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

    // Puxa sessão atual
    const session = await getSession(phone);

    // Todas as mensagens respondidas pelo bot ficam aqui
    const replies = [];

    // Define o contexto que cada flow usa
    const ctx = {
      from: phone,
      message: msg,

      // Quando um flow chamar ctx.send(), a mensagem vai para o ZAPI real
      async send(text) {
        replies.push(text);
        await sendText(phone, text); // <<< AQUI ESTÁ A MAGIA
      },

      async setState(data) {
        await updateSession(phone, data);
      }
    };

    // Roteamento baseado na etapa
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

    // Render recebe apenas confirmação
    return res.json({ ok: true, replies });

  } catch (err) {
    console.log("Erro no routerMiddleware:", err);
    return res.json({ ok: false });
  }
}

export default routerMiddleware;
