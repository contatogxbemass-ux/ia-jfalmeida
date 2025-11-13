const express = require("express");
const axios = require("axios");
require("dotenv").config();

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
// 🔥 ADMINS AUTORIZADOS
// ===============================================
const ADMINS = [
    "5511913306305"
];

// ===============================================
// 🔥 ESTADO DO USUÁRIO
// ===============================================
const estados = {};
// estados[telefone] = { stage, lastMessage, silencio }

// ===============================================
// 🔥 WEBHOOK
// ===============================================
app.post("/webhook", async (req, res) => {

    console.log("📩 RECEBIDO:", req.body);

    const msg =
        req.body?.text?.message ||
        req.body?.message ||
        req.body?.body ||
        null;

    const telefone = req.body.phone;

    if (!telefone || !msg) return res.sendStatus(200);

    // criar estado inicial
    if (!estados[telefone]) {
        estados[telefone] = {
            stage: "menu",
            lastMessage: null,
            silencio: false
        };
    }

    const estado = estados[telefone];
    const txt = msg.trim().toLowerCase();

    // ===============================================
    // 🔥 COMANDOS DE ADMIN (/pausar /voltar)
    // ===============================================
    if (ADMINS.includes(telefone)) {

        if (txt === "/pausar") {
            estado.silencio = true;
            console.log("🤫 BOT PAUSADO PARA:", telefone);
            await enviarMensagemWhatsApp(telefone, "🤫 Bot pausado para este cliente.");
            return res.sendStatus(200);
        }

        if (txt === "/voltar") {
            estado.silencio = false;
            estado.stage = "menu";
            console.log("🔊 BOT VOLTOU PARA:", telefone);
            await enviarMensagemWhatsApp(telefone, "🔊 Bot reativado! Aqui está o menu:");
            await enviarMensagemWhatsApp(telefone, menuPrincipal());
            return res.sendStatus(200);
        }
    }

    // cliente está pausado → não responder
    if (estado.silencio) {
        console.log("🛑 Ignorado (modo silencioso):", telefone);
        return res.sendStatus(200);
    }

    // anti-spam
    if (estado.lastMessage === msg) return res.sendStatus(200);
    estado.lastMessage = msg;

    // comando global de menu
    if (txt === "menu") {
        estado.stage = "menu";
        await enviarMensagemWhatsApp(telefone, menuPrincipal());
        return res.sendStatus(200);
    }

    // ===============================================
    // 🔥 MENU PRINCIPAL
    // ===============================================
    if (estado.stage === "menu") {

        if (msg === "1") {
            estado.stage = "fluxo_compra";
            return enviarMensagemWhatsApp(
                telefone,
                "Perfeito! Me envie TUDO em uma única mensagem:\n\n" +
                "1️⃣ Tipo do imóvel\n" +
                "2️⃣ Bairro desejado\n" +
                "3️⃣ Orçamento máximo\n" +
                "4️⃣ Forma de pagamento\n" +
                "5️⃣ Urgência"
            ).then(() => res.sendStatus(200));
        }

        if (msg === "2") {
            estado.stage = "fluxo_venda";
            return enviarMensagemWhatsApp(
                telefone,
                "Ótimo! Envie em UMA mensagem:\n\n" +
                "1️⃣ Tipo do imóvel\n" +
                "2️⃣ Localização\n" +
                "3️⃣ Quartos\n" +
                "4️⃣ Estado de conservação\n" +
                "5️⃣ Valor desejado"
            ).then(() => res.sendStatus(200));
        }

        if (msg === "3") {
            estado.stage = "fluxo_financiamento";
            return enviarMensagemWhatsApp(
                telefone,
                "Vamos sim! Envie:\n\n" +
                "1️⃣ Renda mensal\n" +
                "2️⃣ Entrada disponível\n" +
                "3️⃣ Tipo do imóvel\n" +
                "4️⃣ Cidade\n" +
                "5️⃣ Tipo de financiamento"
            ).then(() => res.sendStatus(200));
        }

        if (msg === "4") {
            estado.stage = "fluxo_listagem";
            return enviarMensagemWhatsApp(
                telefone,
                "Claro! Envie:\n\n" +
                "1️⃣ Tipo de imóvel\n" +
                "2️⃣ Região\n" +
                "3️⃣ Preço máximo\n" +
                "4️⃣ Quartos\n" +
                "5️⃣ Finalidade"
            ).then(() => res.sendStatus(200));
        }

        if (msg === "0") {
            estado.stage = "aguardando_corretor";
            return enviarMensagemWhatsApp(
                telefone,
                "📞 Vou te conectar com um corretor agora.\nEnvie:\n• Nome completo\n• Melhor horário\n• Assunto"
            ).then(() => res.sendStatus(200));
        }

        await enviarMensagemWhatsApp(telefone, menuPrincipal());
        return res.sendStatus(200);
    }

    // ===============================================
    // 🔥 FLUXOS — APÓS RESPOSTA FINAL
    // ===============================================
    if (
        estado.stage === "fluxo_compra" ||
        estado.stage === "fluxo_venda" ||
        estado.stage === "fluxo_financiamento" ||
        estado.stage === "fluxo_listagem"
    ) {
        const resumo = await gerarResumoIA(estado.stage, msg);

        await enviarMensagemWhatsApp(telefone, resumo);

        await enviarMensagemWhatsApp(
            telefone,
            "Perfeito! Já encaminhei suas informações para um corretor da JF Almeida.\nEle irá te chamar em instantes. 🙂"
        );

        estado.stage = "aguardando_corretor";
        return res.sendStatus(200);
    }

    return res.sendStatus(200);
});

// ===============================================
// 🔥 MENU
// ===============================================
function menuPrincipal() {
    return (
        "👋 *Bem-vindo(a) à JF Almeida Imóveis!*\n\n" +
        "1️⃣ Comprar imóvel\n" +
        "2️⃣ Vender imóvel\n" +
        "3️⃣ Financiamento\n" +
        "4️⃣ Ver imóveis\n" +
        "0️⃣ Falar com corretor"
    );
}

// ===============================================
// 🔥 IA RESUMO
// ===============================================
async function gerarResumoIA(fluxo, msg) {
    const prompt = `
Organize profissionalmente as informações do cliente.
Fluxo: ${fluxo}
Respostas: ${msg}
    `;

    try {
        const r = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "Você é um atendente profissional da JF Almeida Imóveis." },
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
        console.log("ERRO IA:", e.response?.data || e.message);
        return "Recebemos suas informações. Obrigado!";
    }
}

// ===============================================
// 🔥 ENVIO Z-API
// ===============================================
async function enviarMensagemWhatsApp(telefone, texto) {
    try {
        await axios.post(
            `https://api.z-api.io/instances/${ZAPI_NUMBER}/token/${ZAPI_TOKEN}/send-text`,
            { phone: telefone, message: texto },
            { headers: { "Client-Token": ZAPI_CLIENT_TOKEN } }
        );
    } catch (e) {
        console.log("ERRO AO ENVIAR:", e.response?.data || e.message);
    }
}

// ===============================================
// 🔥 SERVIDOR
// ===============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("🔥 Servidor rodando na porta " + PORT);
});
