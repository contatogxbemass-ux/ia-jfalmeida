const { updateState } = require("../services/state.service");
const { sendText } = require("../services/zapi.service");

module.exports = async function menuFlow(telefone, msg, state) {

    switch (msg) {
        case "1":
            updateState(telefone, { etapa: "compra_tipo", dados: {} });
            return sendText(telefone, "Qual *tipo de imóvel* você procura?");

        case "2":
            updateState(telefone, { etapa: "alug_cliente_tipo", dados: {} });
            return sendText(telefone, "Qual tipo de imóvel deseja alugar?");

        case "3":
            updateState(telefone, { etapa: "list_tipo", dados: {} });
            return sendText(telefone, "Qual tipo de imóvel quer ver?");

        case "4":
            updateState(telefone, { etapa: "venda_tipo", dados: {} });
            return sendText(telefone, "Qual tipo de imóvel deseja vender?");

        case "5":
            updateState(telefone, { etapa: "alug_prop_tipo", dados: {} });
            return sendText(telefone, "Qual tipo de imóvel deseja colocar para aluguel?");

        case "6":
            updateState(telefone, { etapa: "fin_renda", dados: {} });
            return sendText(telefone, "Qual sua renda mensal aproximada?");

        case "0":
            updateState(telefone, { etapa: "aguardando_corretor", dados: {} });
            return sendText(telefone, "📞 Envie:\nSeu nome\nMelhor horário\nAssunto");

        default:
            return sendText(telefone, "Opção inválida.\n\n" + menuPrincipal());
    }
};

function menuPrincipal() {
    return (
        "👋 *Bem-vindo à JF Almeida!*\n\n" +
        "1️⃣ Comprar\n" +
        "2️⃣ Alugar\n" +
        "3️⃣ Ver imóveis\n" +
        "4️⃣ Vender imóvel\n" +
        "5️⃣ Colocar imóvel para aluguel\n" +
        "6️⃣ Financiamentos\n" +
        "0️⃣ Falar com corretor\n\n" +
        "Digite *menu* a qualquer momento."
    );
}
