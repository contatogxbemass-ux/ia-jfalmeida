const loggerMiddleware = async (ctx, next) => {
  console.log("📩 RECEBIDO DO Z-API:", JSON.stringify(ctx.update, null, 2));
  await next();
};

export default loggerMiddleware;
