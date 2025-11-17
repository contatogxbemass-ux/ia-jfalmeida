const axios = require("axios");
const tenants = require("../config/tenants.config");

require("dotenv").config();

const OPENAI_KEY = process.env.OPENAI_KEY;
const MODEL = "gpt-4o-mini";

const TIMEOUT = 15000;
const RETRIES = 3;
const WAIT = 800;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function basePrompt(tenantId) {
  const t = tenants[tenantId] || tenants["default"];
  return t.promptBase.trim();
}

async function gerarResumoIA(tenantId, fluxo, dados, telefone) {
  const prompt = `
${basePrompt(tenantId)}

Fluxo: ${fluxo}
Telefone: ${telefone}

Dados coletados:
${JSON.stringify(dados, null, 2)}

Monte um resumo profissional, direto e usado internamente.
  `;

  for (let i = 1; i <= RETRIES; i++) {
    try {
      const r = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: MODEL,
          temperature: 0.3,
          messages: [
            { role: "system", content: "Você é um assistente profissional." },
            { role: "user", content: prompt }
          ],
        },
        {
          timeout: TIMEOUT,
          headers: {
            Authorization: `Bearer ${OPENAI_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      return r.data.choices[0].message.content || "Resumo interno gerado.";
    } catch (err) {
      console.error("⚠️ ERRO IA:", err.response?.data || err);
      await sleep(WAIT);
    }
  }

  return "Resumo interno concluído.";
}

module.exports = { gerarResumoIA };
