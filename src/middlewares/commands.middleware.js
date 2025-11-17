// src/middlewares/commands.middleware.js
const { showMainMenu } = require("../utils/menu.util");

module.exports = async (ctx, next) => {
  // Mensagem sempre tratada em minúsculo
  const msg = ctx.body?.trim().toLowerCase() || "";

  // Quando o usuário digita "menu" ou "/menu"
  if (msg === "menu" || msg === "/menu") {
    await ctx.setState({ etapa: "menu" });
    await ctx.send(showMainMenu());
    return;
  }

  // Nenhum comando especial → segue o fluxo normal
  return next();
};
