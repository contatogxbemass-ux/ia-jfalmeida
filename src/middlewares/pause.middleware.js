import pkg from "../services/redis.service.js";
const { getAsync } = pkg;

const pauseMiddleware = async (ctx, next) => {
  const user = await getAsync(ctx.from);

  if (user?.paused) {
    return; // não responde NADA
  }

  next();
};

export default pauseMiddleware;
