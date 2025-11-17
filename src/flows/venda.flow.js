const { gerarResumoIA } = require("../services/openai.service");

module.exports = async function vendaFlow(phone, msg, state, ctx) {
  state.fluxo = "Venda";
  state.telefone = phone;
  state.dados = state.dados || {};

  if (state.etapa === "venda_inicio") {
    state.dados.cidade = msg;
    await ctx.setState({ etapa: "venda_tipo", ...state });
    await ctx.send("Qual tipo de imóvel deseja vender?");
    return;
  }

  if (state.etapa === "venda_tipo") {
    state.dados.tipo = msg;
    await ctx.setState({ etapa: "venda_tamanho", ...state });
    await ctx.send("Qual tamanho do imóvel?");
    return;
  }

  if (state.etapa === "venda_tamanho") {
    state.dados.tamanho = msg;
    await ctx.setState({ etapa: "venda_valor", ...state });
    await ctx.send("Qual valor desejado?");
    return;
  }

  if (state.etapa === "venda_valor") {
    state.dados.valor = msg;
    await ctx.send("Gerando resumo...");

    const resumo = await gerarResumoIA("default", state.fluxo, state.dados, phone);
    await ctx.send(resumo);

    await ctx.send("Encaminhado ao corretor!");
    await ctx.setState({ etapa: "aguardando_corretor" });
  }
};
