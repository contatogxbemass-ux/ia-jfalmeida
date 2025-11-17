// src/middlewares/router.middleware.js

import { getAsync } from "../services/redis.service.js";

export const routerMiddleware = async (ctx, next) => {
  try {
    const user = ctx.from;

    // Verifica se o usuário está pausado
    const isPaused = await getAsync(`pause:${user}`);

    // SE ESTIVER PAUSADO → silêncio total, sem enviar NADA.
    if (isPaused === "true") {
      return; // não chama next(), não envia mensagem
    }

    // Se não estiver pausado, segue o fluxo normal
    return next();

  } catch (err) {
    console.error("Erro no routerMiddleware:", err);
    return next();
  }
};
