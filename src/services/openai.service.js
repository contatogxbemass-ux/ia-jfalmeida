// src/services/openai.service.js
const axios = require("axios");
require("dotenv").config();

const OPENAI_KEY = process.env.OPENAI_KEY;

async function iaResumo(fluxo, dados, telefone) {
  const prompt = `
Organize de forma clara as informações abaixo para um corretor de imóveis.

Fluxo: ${fluxo}
Telefone do cliente: ${telefone}

Dados:
${JSON.stringify(dados, null, 2)}

Monte um texto com:
- Título
- Lista de informações
- Fechamento agradecendo e dizendo que um corretor fará contato.
`.trim();

  try {
    const r = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Você é um assistente profissional da JF Almeida Imóveis."
          },
          { role: "user", content: prompt }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return r.data.choices[0].message.content;
  } catch (err) {
    console.log("ERRO OPENAI:", err.response?.data || err.message);
    return "Recebi suas informações e já encaminhei para um corretor da JF Almeida.";
  }
}

module.exports = { iaResumo };
