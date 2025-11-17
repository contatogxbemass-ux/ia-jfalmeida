import pkg from "../services/redis.service.js";
const { setAsync, delAsync } = pkg;

const commandsMiddleware = async (ctx, next) => {
  const msg = ctx.body?.message?.trim();

  if (!msg) return next();

  if (msg === "/pausar") {
    await setAsync(ctx.from, { paused: true });
    await ctx.send("⏸️ Bot pausado. Digite /voltar para continuar.");
    return;
  }

  if (msg === "/voltar") {
    await delAsync(ctx.from);
    await ctx.send("▶️ Bot retomado.");
    return;
  }

  next();
};

export default commandsMiddleware;
