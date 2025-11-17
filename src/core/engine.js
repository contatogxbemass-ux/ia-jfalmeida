import { sendText } from "../services/zapi.service.js";
import { getSession, updateSession, resetSession } from "../services/redis.service.js";

import loggerMiddleware from "../middlewares/logger.middleware.js";
import rateLimitMiddleware from "../middlewares/rateLimit.middleware.js";
import commandsMiddleware from "../middlewares/commands.middleware.js";
import pauseMiddleware from "../middlewares/pause.middleware.js";
import routerMiddleware from "../middlewares/router.middleware.js";

async function runMiddlewares(ctx, middlewares, index = 0) {
  if (index >= middlewares.length) return;
  const next = () => runMiddlewares(ctx, middlewares, index + 1);
  await middlewares[index](ctx, next);
}

export async function handleWebhook(req, res) {
  console.log("📩 RECEBIDO DO Z-API:", JSON.stringify(req.body, null, 2));

  const phone = req.body.phone;
  const msg = req.body.text?.message?.trim() || "";

  if (!phone) return res.sendStatus(200);

  let state = await getSession(phone);

  if (state.lastMessageId === req.body.messageId) {
    return res.sendStatus(200);
  }

  state = await updateSession(phone, { lastMessageId: req.body.messageId });

  const ctx = {
    phone,
    message: msg,
    state,

    async send(text) {
      await sendText(phone, text);
    },

    async setState(data) {
      this.state = await updateSession(phone, data);
    },

    async resetState() {
      this.state = await resetSession(phone);
    },
  };

  const middlewares = [
    loggerMiddleware,
    rateLimitMiddleware,
    commandsMiddleware,
    pauseMiddleware,
    routerMiddleware,
  ];

  try {
    await runMiddlewares(ctx, middlewares);
  } catch (err) {
    console.error("💥 ERRO NA ENGINE:", err);
    await ctx.send("Erro interno. Digite *menu*.");
    await ctx.resetState();
  }

  return res.sendStatus(200);
}
