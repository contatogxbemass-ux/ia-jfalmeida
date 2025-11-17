import { updateSession } from "../services/redis.service.js";

const listFlow = async (ctx) => {
  const msg = ctx.message?.trim();

  if (!msg) {
    return ctx.send("Envie o código do imóvel que deseja listar.");
  }

  if (msg.toLowerCase() === "menu") {
    await updateSession(ctx.from, { etapa: "menu" });
    return ctx.send("Retornando ao menu...");
  }

  await ctx.send(`Listando informações do imóvel: ${msg}`);
};

export default listFlow;
