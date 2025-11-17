const { gerarResumoIA } = require("../services/openai.service");

module.exports = async function aluguelFlow(phone, msg, state, ctx) {
  state.fluxo = "Aluguel";
  state.telefone = phone;
  state.dados = state.dados || {};

  if (state.etapa === "aluguel_inicio") {
    state.dados.cidade = msg;
    await ctx.setState({ etapa: "aluguel_tipo", ...state });
    await ctx.send("Qual tipo de imóvel deseja alugar?");
    return;
  }

  if (state.etapa === "aluguel_tipo") {
    state.dados.tipo = msg;
    await ctx.setState({ etapa: "aluguel_valor", ...state });
    await ctx.send("Qual valor máximo do aluguel?");
    return;
  }

  if (state.etapa === "aluguel_valor") {
    state.dados.valor = msg;
    await ctx.send("Gerando resumo para o corretor...");

    const resumo = await gerarResumoIA("default", state.fluxo, state.dados, phone);
    await ctx.send(resumo);

    await ctx.send("Encaminhado ao corretor!");
    await ctx.setState({ etapa: "aguardando_corretor" });
  }
};
