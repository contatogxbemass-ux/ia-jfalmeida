import { updateSession } from "../services/redis.service.js";

const vendaFlow = async (ctx) => {
  const msg = ctx.message?.trim();

  if (!msg) {
    return ctx.send("Qual o endereço do imóvel que deseja vender?");
  }

  if (msg.toLowerCase() === "menu") {
    await updateSession(ctx.from, { etapa: "menu" });
    return ctx.send("Voltando ao menu...");
  }

  await ctx.send("Ótimo! Vamos iniciar a pré-avaliação.");
  await ctx.send(`Endereço informado: ${msg}`);
  await ctx.send("Um corretor entrará em contato para continuar o processo.");
};

export default vendaFlow;
