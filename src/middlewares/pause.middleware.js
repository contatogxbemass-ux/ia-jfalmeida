module.exports = async function pauseMiddleware(ctx, next) {
  if (ctx.state.paused) {
    await ctx.send("⏸️ Bot pausado. Digite /voltar para continuar.");
    return;
  }
  return next();
};
