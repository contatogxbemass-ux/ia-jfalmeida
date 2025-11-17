import redis from "../services/redis.service.js";
const { getAsync } = redis;

const pauseMiddleware = async (ctx, next) => {
  const paused = await getAsync(`paused:${ctx.from}`);
  if (paused) return; // silêncio TOTAL
  return next();
};

export default pauseMiddleware;
