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

// 🔥 Função que normaliza tudo ANTES de mandar à IA
function formatarDados(dados) {
  if (!dados) return "Nenhum dado coletado.";

  if (typeof dados === "string") return dados;

  try {
    return Object.entries(dados)
      .map(([k, v]) => `- ${k}: ${v}`)
      .join("\n");
  } catch {
    return JSON.stringify(dados, null, 2);
  }
}

async function gerarResumoIA(tenantId, fluxo, dados, telefone) {

  const fluxoNome =
    typeof fluxo === "string"
      ? fluxo
      : fluxo?.nome || fluxo?.flow || "Fluxo não identificado";

  const dadosFormatados = formatarDados(dados);

  const prompt = `
${basePrompt(tenantId)}

*Resumo interno de atendimento*

Fluxo: ${fluxoNome}
Telefone: ${telefone || "Não informado"}

Dados coletados:
${dadosFormatados}

Monte um resumo profissional, direto, sem enfeites, para uso interno pelo corretor.
`;

  for (let i = 1; i <= RETRIES; i++) {
    try {
      const r = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: MODEL,
          temperature: 0.2,
          messages: [
            { role: "system", content: "Você é um assistente extremamente objetivo e profissional." },
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
