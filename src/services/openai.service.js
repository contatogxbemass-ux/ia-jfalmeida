const axios = require("axios");

async function gerarResumoIA(tenantId, fluxo, dados, telefone) {
  const prompt = `
Resumo interno de atendimento:

Fluxo: ${fluxo}
Telefone: ${telefone}

Dados coletados:
${Object.entries(dados).map(([k, v]) => `- ${k}: ${v}`).join("\n")}

Gere um resumo profissional, direto, objetivo, para uso interno.
`;

  const res = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: "Você é um assistente objetivo e profissional." },
        { role: "user", content: prompt }
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return res.data.choices[0].message.content;
}

module.exports = { gerarResumoIA };
