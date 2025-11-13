// ===============================================
// 🔥 DEPENDÊNCIAS
// ===============================================
const express = require("express");
const axios = require("axios");
require("dotenv").config();

// ===============================================
// 🔥 APP
// ===============================================
const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ===============================================
// 🔥 Z-API CONFIG
// ===============================================
const ZAPI_NUMBER = process.env.ZAPI_NUMBER;
const ZAPI_TOKEN = process.env.ZAPI_TOKEN;
const ZAPI_CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN;

// ===============================================
// 🔥 OPENAI CONFIG
// ===============================================
const OPENAI_KEY = process.env.OPENAI_KEY;

// ===============================================
// 🔥 ESTADOS DOS USUÁRIOS
// ===============================================
const estados = {};


// ===============================================
// 🔥 WEBHOOK — este é o coração do bot
// ===============================================
app.post("/webhook", async (req, res) => {
    console.log("📩 RECEBIDO DO Z-API:", req.body);

    // 🟢 Ajuste FINAL → Captura do formato REAL da Z-API
    const msg =
        req.body?.text?.message ||   // onde a Z-API envia mensagem
        req.body?.message ||         // fallback
        null;

    const telefone =
        req.body?.connectedPhone ||  // onde a Z-API envia telefone
        req.body?.phone ||           // fallback
        null;

    if (!telefone || !msg) {
        console.log("⚠️ Ignorado: mensagem sem telefone ou sem conteúdo");
        return res.sendStatus(200);
    }

    // 🟢 Inicializa estado do usuário
    if (!estados[telefone]) {
        estados[telefone] = { stage: "menu", lastMessage: null };
    }

    const estado = estados[telefone];

    // 🟡 Anti-spam: evita mensagens duplicadas da Z-API
    if (estado.lastMessage === msg) return res.sendStatus(200);
    estado.lastMessage = msg;

    const txt = msg.trim().toLowerCase();

    // 🟣 Se já escolheu falar com corretor → bot não responde mais
    if (estado.stage === "aguardando_corretor") {
        console.log("👤 Cliente aguardando corretor, bot pausado.");
        return res.sendStatus(200);
    }

    // 🔵 Comando global
    if (txt === "menu") {
        estado.stage = "menu";
        await enviarMensagemWhatsApp(telefone, menuPrincipal());
        return res.sendStatus(200);
    }

    // ===============================================
    // 🔥 MENU PRINCIPAL
    // ===============================================
    if (estado.stage === "menu") {
        if (txt === "1") {
            estado.stage = "fluxo_compra";
            return enviarMensagemWhatsApp(
                telefone,
                "Perfeito! Para encontrar o imóvel ideal, envie tudo em **uma única mensagem**:\n\n" +
                "1️⃣ Tipo do imóvel\n" +
                "2️⃣ Bairro/região\n" +
                "3️⃣ Orçamento máximo\n" +
                "4️⃣ Pagamento (financiado / à vista)\n" +
                "5️⃣ Urgência"
            ).then(() => res.sendStatus(200));
        }

        if (txt === "2") {
            estado.stage = "fluxo_venda";
            return enviarMensagemWhatsApp(
                telefone,
                "Ótimo! Para ajudar na venda, envie tudo em **uma única mensagem**:\n\n" +
                "1️⃣ Tipo do imóvel\n" +
                "2️⃣ Localização\n" +
                "3️⃣ Quartos / tamanho\n" +
                "4️⃣ Estado de conservação\n" +
                "5️⃣ Valor desejado"
            ).then(() => res.sendStatus(200));
        }

        if (txt === "3") {
            estado.stage = "fluxo_financiamento";
            return enviarMensagemWhatsApp(
                telefone,
                "Certo! Para analisar o financiamento, envie tudo em **uma única mensagem**:\n\n" +
                "1️⃣ Renda mensal\n" +
                "2️⃣ Entrada disponível\n" +
                "3️⃣ Tipo do imóvel\n" +
                "4️⃣ Cidade\n" +
                "5️⃣ Tipo de financiamento (se souber)"
            ).then(() => res.sendStatus(200));
        }

        if (txt === "4") {
            estado.stage = "fluxo_listagem";
            return enviarMensagemWhatsApp(
                telefone,
                "Beleza! Para listar imóveis, envie tudo em **uma única mensagem**:\n\n" +
                "1️⃣ Tipo do imóvel\n" +
                "2️⃣ Bairro/região\n" +
                "3️⃣ Preço máximo\n" +
                "4️⃣ Quartos\n" +
                "5️⃣ Finalidade (moradia / investimento)"
            ).then(() => res.sendStatus(200));
        }

        if (txt === "0") {
            estado.stage = "aguardando_corretor";
            return enviarMensagemWhatsApp(
                telefone,
                "📞 Perfeito! Vou te conectar com um corretor.\n\n" +
                "Envie por favor:\n" +
                "• Seu nome completo\n" +
                "• Melhor horário para contato\n" +
                "• Assunto (compra, venda, dúvida…)\n\n" +
                "Assim que enviar, um corretor te chama. 🙂"
            ).then(() => res.sendStatus(200));
        }

        // Entrada inválida → mostra o menu novamente
        await enviarMensagemWhatsApp(telefone, menuPrincipal());
        return res.sendStatus(200);
    }

    // ===============================================
    // 🔥 FLUXOS QUE GERAM RESUMO E ENCERRAM
    // ===============================================
    if (estado.stage.startsWith("fluxo_")) {
        const resumo = await gerarResumoIA(estado.stage, msg);

        await enviarMensagemWhatsApp(telefone, resumo);

        await enviarMensagemWhatsApp(
            telefone,
            "Ótimo! Já encaminhei suas informações para um corretor.\n" +
            "Ele irá te chamar em instantes."
        );

        estado.stage = "aguardando_corretor";
        return res.sendStatus(200);
    }

    return res.sendStatus(200);
});


// ===============================================
// 🔥 MENU PRINCIPAL
// ===============================================
function menuPrincipal() {
    return (
        "👋 *Bem-vindo(a) à JF Almeida Imóveis!*\n\n" +
        "Escolha uma opção:\n\n" +
        "1️⃣ Comprar imóvel\n" +
        "2️⃣ Vender imóvel\n" +
        "3️⃣ Consultar financiamento\n" +
        "4️⃣ Ver imóveis disponíveis\n" +
        "0️⃣ Falar com um corretor"
    );
}


// ===============================================
// 🔥 IA — ORGANIZAÇÃO DO RESUMO
// ===============================================
async function gerarResumoIA(fluxo, msg) {
    const prompt = `
Organize profissionalmente as informações abaixo em forma de lista.
Fluxo: ${fluxo}
Conteúdo: ${msg}

Formato:
- Título
- Lista organizada
- Agradecimento final
    `;

    try {
        const r = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "Atue como atendente profissional da JF Almeida Imóveis." },
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
        return "Recebemos suas informações.";
    }
}


// ===============================================
// 🔥 ENVIO DE MENSAGEM VIA Z-API
// ===============================================
async function enviarMensagemWhatsApp(telefone, texto) {
    try {
        await axios.post(
            `https://api.z-api.io/instances/${ZAPI_NUMBER}/token/${ZAPI_TOKEN}/send-text`,
            { phone: telefone, message: texto },
            { headers: { "Client-Token": ZAPI_CLIENT_TOKEN } }
        );
    } catch (e) {
        console.log("❌ ERRO ENVIO:", e.response?.data || e.message);
    }
}


// ===============================================
// 🔥 SERVIDOR
// ===============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("🔥 Servidor rodando na porta " + PORT);
});
