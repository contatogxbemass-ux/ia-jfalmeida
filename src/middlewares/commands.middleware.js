import redis from "../services/redis.service.js";
const { setAsync, delAsync, getAsync } = redis;

const commandsMiddleware = async (ctx, next) => {
  const body = ctx?.message?.toLowerCase()?.trim() || "";
  const phone = ctx.from;

  if (body === "/pausar") {
    await setAsync(`paused:${phone}`, true);
    return; // silencioso
  }

  if (body === "/voltar") {
    await delAsync(`paused:${phone}`);
    await ctx.send("🔄 Bot retomado.");
    return;
  }

  const paused = await getAsync(`paused:${phone}`);
  if (paused) return;

  return next();
};

export default commandsMiddleware;
