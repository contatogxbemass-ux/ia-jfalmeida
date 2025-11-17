module.exports = async (ctx, next) => {
  const msg = ctx.body.trim().toLowerCase();

  if (msg === "menu") {
    await ctx.setState({ etapa: "menu" });
    await ctx.send(ctx.showMainMenu());
    return;
  }

  await next();
};
