// src/middlewares/pause.middleware.js

import { getAsync } from "../services/redis.service.js";

export const pauseMiddleware = async (ctx, next) => {
  try {
    const phone = ctx.from;

    const paused = await getAsync(`pause:${phone}`);

    // Se pausado → NÃO envia nada e NÃO chama next()
    if (paused === "true") {
      return; 
    }

    // Se não está pausado → segue fluxo normal
    return next();

  } catch (error) {
    console.error("Erro no pauseMiddleware:", error);
    return next();
  }
};
