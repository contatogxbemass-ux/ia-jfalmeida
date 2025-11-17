const axios = require("axios");
require("dotenv").config();

const OPENAI_KEY = process.env.OPENAI_KEY;

async function gerarResumoIA(fluxo, dados, telefone) {
  const prompt = `
Monte um resumo profissional para o corretor da JF Almeida:

Fluxo: ${fluxo}
Telefone: ${telefone}

Dados:
${JSON.stringify(dados, null, 2)}

Monte:
- Título
- Pontos organizados (bullet points)
- Observações importantes
- Fechamento curto para o corretor
  `;

  try {
    const r = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Você é um assistente da JF Almeida, direto e profissional." },
          { role: "user", content: prompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return r.data.choices[0].message.content;
  } catch (e) {
    console.log("ERRO IA:", e.response?.data || e.message);
    return "Resumo interno gerado e encaminhado ao corretor.";
  }
}

module.exports = { gerarResumoIA };
