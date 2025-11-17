const loggerMiddleware = async (ctx, next) => {
  console.log("📩 RECEBIDO:", JSON.stringify(ctx.update, null, 2));
  await next();
};

export default loggerMiddleware;
