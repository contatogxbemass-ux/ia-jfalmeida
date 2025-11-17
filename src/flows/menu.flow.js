const { sendButtons } = require("../services/buttons.service");

async function menuPrincipalFlow(phone) {
  await sendButtons(
    phone,
    "👋 *Bem-vindo(a) à JF Almeida Imóveis!*\nSelecione uma opção:",
    [
      { id: "1", text: "1️⃣ Comprar" },
      { id: "2", text: "2️⃣ Alugar" },
      { id: "3", text: "3️⃣ Ver imóveis" },
      { id: "4", text: "4️⃣ Vender imóvel" },
      { id: "5", text: "5️⃣ Colocar para aluguel" },
      { id: "0", text: "0️⃣ Falar com corretor" }
    ]
  );
}

module.exports = { menuPrincipalFlow };
