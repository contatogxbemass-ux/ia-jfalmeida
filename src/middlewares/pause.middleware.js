// src/middlewares/pause.middleware.js

import { getAsync } from "../services/redis.service.js";

export const pauseMiddleware = async (ctx, next) => {
  try {
    const phone = ctx.from;
    const isPaused = await getAsync(`pause:${phone}`);

    // Se o usuário está pausado → silêncio total
    if (isPaused === "true") {
      return;
    }

    // Senão → segue fluxo normal
    return next();

  } catch (error) {
    console.error("Erro no pauseMiddleware:", error);
    return next();
  }
};
