const axios = require("axios");

const OPENAI_KEY = process.env.OPENAI_KEY;

/**
 * Gera resumo estruturado via OpenAI
 */
async function iaResumo(fluxo, dados, telefone) {
    const prompt = `
Organize as informações abaixo de forma clara e profissional para o corretor JF Almeida.

Fluxo: ${fluxo}
Telefone: ${telefone}

Dados:
${JSON.stringify(dados, null, 2)}

Monte:
- Um título profissional
- Lista de informações importantes
- Observações relevantes
- Mensagem final de encaminhamento
    `.trim();

    try {
        const r = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content:
                            "Você é um assistente imobiliário altamente profissional e direto."
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

    } catch (e) {
        console.log("❌ ERRO IA:", e.response?.data || e.message);
        return "Resumo gerado e enviado ao corretor.";
    }
}

module.exports = {
    iaResumo
};