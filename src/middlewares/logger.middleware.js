module.exports = async function loggerMiddleware(ctx, next) {
  console.log(
    `👤 ${ctx.phone} | etapa: ${ctx.state.etapa} | msg: "${ctx.msg}"`
  );
  return next();
};
