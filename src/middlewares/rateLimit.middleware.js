const { redis } = require("../services/redis.service");

const LIMIT_WINDOW = 60;
const MAX_MSGS_PER_MIN = 20;
const MIN_INTERVAL_MS = 1200;

module.exports = async function rateLimitMiddleware(ctx, next) {
  const tenantId = ctx.tenantId;
  const phone = ctx.phone;

  // keys por tenant
  const keyCount = `rl:count:${tenantId}:${phone}`;
  const keyLast = `rl:last:${tenantId}:${phone}`;

  const now = Date.now();
  const last = await redis.get(keyLast);
  const count = await redis.incr(keyCount);

  if (count === 1) {
    await redis.expire(keyCount, LIMIT_WINDOW);
  }

  if (last && now - parseInt(last) < MIN_INTERVAL_MS) {
    await ctx.send("⚠️ Aguarde um instante antes de enviar outra mensagem.");
    return;
  }

  if (count > MAX_MSGS_PER_MIN) {
    await ctx.send("🚫 Muitas mensagens. Aguarde um minuto.");
    return;
  }

  await redis.set(keyLast, now, "EX", LIMIT_WINDOW);

  return next();
};
