// src/middlewares/commands.middleware.js

import { setAsync, delAsync } from "../services/redis.service.js";

export const commandsMiddleware = async (ctx, next) => {
  const body = ctx.body?.trim().toLowerCase();
  const phone = ctx.from;

  // PAUSAR BOT
  if (body === "/pausar") {
    await setAsync(`pause:${phone}`, "true");
    await ctx.send("⏸️ Bot pausado.");
    return;
  }

  // RETOMAR BOT
  if (body === "/voltar") {
    await delAsync(`pause:${phone}`);
    await ctx.send("▶️ Bot retomado.");
    return;
  }

  // Continua fluxo
  return next();
};
