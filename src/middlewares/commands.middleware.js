const { showMainMenu } = require("../utils/menu.util");

module.exports = async function commandsMiddleware(ctx, next) {
  const m = ctx.msgLower;

  if (m === "/pausar") {
    await ctx.setState({ paused: true });
    await ctx.send("⏸️ Bot pausado. Digite /voltar para continuar.");
    return;
  }

  if (m === "/voltar") {
    await ctx.setState({ paused: false });
    await ctx.send("▶️ Bot retomado.");
    return;
  }

  if (m === "menu" || m === "/menu") {
    await ctx.resetState();
    await ctx.send(showMainMenu());
    return;
  }

  return next();
};
