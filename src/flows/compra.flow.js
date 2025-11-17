const { gerarResumoIA } = require("../services/openai.service");

module.exports = async function compraFlow(phone, msg, state, ctx) {
  state.fluxo = "Compra";
  state.telefone = phone;
  state.dados = state.dados || {};

  if (state.etapa === "compra_inicio") {
    state.dados.cidade = msg;
    await ctx.setState({ etapa: "compra_tipo", ...state });
    await ctx.send("Qual tipo de imóvel está procurando?");
    return;
  }

  if (state.etapa === "compra_tipo") {
    state.dados.tipo = msg;
    await ctx.setState({ etapa: "compra_valor", ...state });
    await ctx.send("Qual faixa de preço?");
    return;
  }

  if (state.etapa === "compra_valor") {
    state.dados.valor = msg;
    await ctx.send("Gerando resumo para o corretor...");

    const resumo = await gerarResumoIA("default", state.fluxo, state.dados, phone);
    await ctx.send(resumo);

    await ctx.send("Encaminhado ao corretor da JF Almeida!");
    await ctx.setState({ etapa: "aguardando_corretor" });
  }
};
