import { updateSession } from "../services/redis.service.js";

const compraFlow = async (ctx) => {
  const msg = ctx.message?.trim();

  if (!msg) {
    return ctx.send("Por favor, envie o tipo de imóvel que deseja comprar.");
  }

  if (msg.toLowerCase() === "menu") {
    await updateSession(ctx.from, { etapa: "menu" });
    return ctx.send("Retornando ao menu...");
  }

  await ctx.send(`Perfeito! Você está buscando compra: ${msg}.`);
  return ctx.send("Um corretor entrará em contato em breve.");
};

export default compraFlow;
