// src/middlewares/pause.middleware.js

import { getAsync } from "../services/redis.service.js";

export const pauseMiddleware = async (ctx, next) => {
  const user = ctx.from;

  try {
    // Verifica no Redis se o atendimento está pausado para este cliente
    const isPaused = await getAsync(`pause:${user}`);

    // Se estiver pausado: o bot NÃO deve enviar nada, apenas silencia
    if (isPaused === "true") {
      return; // interrompe o fluxo silenciosamente
    }

    // Se não estiver pausado, segue o fluxo normal
    return next();
  } catch (error) {
    console.error("Erro no pauseMiddleware:", error);
    return next(); // fallback para não travar o bot
  }
};
