import { updateSession } from "../services/redis.service.js";
import showMainMenu from "../utils/menu.util.js";

const menuFlow = async (ctx) => {
  const msg = ctx.message?.trim();

  // MENU PRINCIPAL
  await ctx.send(showMainMenu());

  if (!msg) return;

  switch (msg) {
    case "1":
      await updateSession(ctx.from, { etapa: "compra" });
      return ctx.send("Ótimo! Vamos verificar imóveis para compra.");

    case "2":
      await updateSession(ctx.from, { etapa: "aluguel" });
      return ctx.send("Perfeito! Vamos procurar imóveis para alugar.");

    case "4":
      await updateSession(ctx.from, { etapa: "venda" });
      return ctx.send("Vamos iniciar o processo de venda do seu imóvel.");

    case "5":
      await updateSession(ctx.from, { etapa: "lista" });
      return ctx.send("Lista de imóveis do proprietário.");

    case "0":
      return ctx.send(
        "Um corretor humano irá falar com você em instantes. Aguarde!"
      );

    default:
      return ctx.send("Opção inválida.\n\n" + showMainMenu());
  }
};

export default menuFlow;
