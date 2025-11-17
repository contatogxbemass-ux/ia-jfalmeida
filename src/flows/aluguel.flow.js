import { updateSession } from "../services/redis.service.js";

const aluguelFlow = async (ctx) => {
  const msg = ctx.message?.trim();

  if (!msg) {
    return ctx.send("Envie o tipo de imóvel que deseja alugar.");
  }

  if (msg.toLowerCase() === "menu") {
    await updateSession(ctx.from, { etapa: "menu" });
    return ctx.send("Voltando ao menu...");
  }

  await ctx.send(`Buscando imóveis para alugar: ${msg}`);
  await ctx.send("Um corretor entrará em contato!");
};

export default aluguelFlow;
