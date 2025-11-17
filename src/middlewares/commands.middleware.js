import redis from "../services/redis.service.js";
const { setAsync, delAsync, getAsync } = redis;

export async function commandsMiddleware(ctx, next) {
  const message = ctx?.message?.toLowerCase()?.trim() || "";
  const phone = ctx.from;

  // ----------------------------
  // COMANDO /pausar
  // ----------------------------
  if (message === "/pausar") {
    await setAsync(`paused:${phone}`, true);
    // NÃO ENVIAMOS NADA DE VOLTA
    return;
  }

  // ----------------------------
  // COMANDO /voltar
  // ----------------------------
  if (message === "/voltar") {
    await delAsync(`paused:${phone}`);
    await ctx.send("🔄 Bot retomado.");
    return;
  }

  // ----------------------------
  // SE O BOT ESTÁ PAUSADO
  // ----------------------------
  const isPaused = await getAsync(`paused:${phone}`);

  if (isPaused) {
    // SE ESTIVER PAUSADO, IGNORA TUDO
    // Apenas deixa o cliente falar e o corretor responde pelo WhatsApp
    return;
  }

  // Continua para os outros middlewares
  await next();
}
