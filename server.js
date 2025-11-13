const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ===============================================
// 🔥 CONFIG Z-API
// ===============================================
const ZAPI_NUMBER = process.env.ZAPI_NUMBER;
const ZAPI_TOKEN = process.env.ZAPI_TOKEN;
const ZAPI_CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN;

// ===============================================
// 🔥 CONFIG OPENAI
// ===============================================
const OPENAI_KEY = process.env.OPENAI_KEY;

// ===============================================
// 🔥 ADMINS AUTORIZADOS
// COLOQUE SEUS NÚMEROS SEM +, SEM ESPAÇO
// EXEMPLO: 5511999998888
// ===============================================
const ADMINS = [
    "5511942063985",
];

// ===============================================
// 🔥 ESTADO GLOBAL DOS USUÁRIOS
// ===============================================
const estados = {};
// estados[telefone] = { stage, lastMessage, silencio, campos... }

// ===============================================
// 🔥 WEBHOOK PRINCIPAL
// ===============================================
app.post("/webhook", async (req, res) => {

    console.log("📩 RECEBIDO:", req.body);

    // captura msg independente do formato da Z-API
    const msg =
        req.body?.text?.message ||
        req.body?.message ||
        req.body?.body ||
        null;

    const telefone = req.body.phone;

    if (!telefone || !msg) return res.sendStatus(200);

    // cria estado inicial
    if (!estados[telefone]) {
        estados[telefone] = {
            stage: "menu",
            lastMessage: null,
            silencio: false,
        };
    }

    const estado = estados[telefone];
    const txt = msg.trim().toLowerCase();

    // ===============================================
    // 🔥 CONTROLES DE ADMIN (/pausar e /voltar)
    // ===============================================

    if (ADMINS.includes(telefone)) {

        if (txt === "/pausar") {
            estado.silencio = true;
            console.log("🤫 BOT PAUSADO PARA:", telefone);
            await enviarMensagemWhatsApp(
                telefone,
                "🤫 Bot pausado para este cliente. Agora apenas atendimento humano responderá."
            );
            return res.sendStatus(200);
        }

        if (txt === "/voltar") {
            estado.silencio = false;
            estado.stage = "menu";
            console.log("🔊 BOT REATIVADO PARA:", telefone);
            await enviarMensagemWhatsApp(
                telefone,
                "🔊 Bot reativado! Voltando ao menu principal."
            );
            await enviarMensagemWhatsApp(telefone, menuPrincipal());
            return res.sendStatus(200);
        }
    }

    // se cliente está em modo silencioso → bot ignora
    if (estado.silencio) {
        console.log("🤫 MODO SILENCIOSO ATIVO — mensagem ignorada.");
        return res.sendStatus(200);
    }

    // anti-spam ZAPI
    if (estado.lastMessage === msg) return res.sendStatus(200);
    estado.lastMessage = msg;

    // comando global
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
            estado.stage = "compra_tipo";
            return enviarMensagemWhatsApp(
                telefone,
                "Perfeito! Vamos iniciar sua busca.\n\n👉 Qual *tipo de imóvel* você procura?"
            );
        }

        if (msg === "2") {
            estado.stage = "venda_tipo";
            return enviarMensagemWhatsApp(
                telefone,
                "Ótimo! Vamos avaliar seu imóvel.\n\n👉 Qual é o *tipo do imóvel*?"
            );
        }

        if (msg === "3") {
            estado.stage = "fin_renda";
            return enviarMensagemWhatsApp(
                telefone,
                "Vamos analisar seu financiamento.\n\n👉 Qual é sua *renda mensal*?"
            );
        }

        if (msg === "4") {
            estado.stage = "list_tipo";
            return enviarMensagemWhatsApp(
                telefone,
                "Vamos listar imóveis.\n\n👉 Qual *tipo de imóvel* você deseja?"
            );
        }

        if (msg === "0") {
            estado.stage = "aguardando_corretor";
            return enviarMensagemWhatsApp(
                telefone,
                "📞 Claro! Encaminhando para um corretor...\n\nEnvie:\n• Nome completo\n• Melhor horário\n• Assunto"
            );
        }

        return enviarMensagemWhatsApp(telefone, menuPrincipal());
    }

    // ===============================================
    // 🔥 FLUXO — COMPRA (pergunta por pergunta)
    // ===============================================
    if (estado.stage === "compra_tipo") {
        estado.tipo = msg;
        estado.stage = "compra_regiao";
        return enviarMensagemWhatsApp(telefone, "👉 Qual *bairro/região* deseja?");
    }

    if (estado.stage === "compra_regiao") {
        estado.regiao = msg;
        estado.stage = "compra_preco";
        return enviarMensagemWhatsApp(telefone, "👉 Qual seu *orçamento máximo*?");
    }

    if (estado.stage === "compra_preco") {
        estado.preco = msg;
        estado.stage = "compra_pagamento";
        return enviarMensagemWhatsApp(telefone, "👉 Forma de pagamento? (à vista / financiado)");
    }

    if (estado.stage === "compra_pagamento") {
        estado.pagamento = msg;
        estado.stage = "compra_urgencia";
        return enviarMensagemWhatsApp(telefone, "👉 Nível de urgência? (baixa / média / alta)");
    }

    if (estado.stage === "compra_urgencia") {
        estado.urgencia = msg;
        estado.stage = "aguardando_corretor";

        const resumo = `
📋 *Resumo da Solicitação de Compra*

• Tipo: ${estado.tipo}
• Região: ${estado.regiao}
• Orçamento: ${estado.preco}
• Pagamento: ${estado.pagamento}
• Urgência: ${estado.urgencia}

🔎 Um corretor da JF Almeida vai te chamar em instantes. 🙂`;

        await enviarMensagemWhatsApp(telefone, resumo);
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
        "1️⃣ Quero comprar um imóvel\n" +
        "2️⃣ Quero vender meu imóvel\n" +
        "3️⃣ Saber sobre financiamentos\n" +
        "4️⃣ Ver imóveis disponíveis\n" +
        "0️⃣ Falar com um corretor"
    );
}

// ===============================================
// 🔥 ENVIO DE MENSAGEM Z-API
// ===============================================
async function enviarMensagemWhatsApp(telefone, texto) {
    try {
        await axios.post(
            `https://api.z-api.io/instances/${ZAPI_NUMBER}/token/${ZAPI_TOKEN}/send-text`,
            { phone: telefone, message: texto },
            { headers: { "Client-Token": ZAPI_CLIENT_TOKEN } }
        );
    } catch (e) {
        console.log("ERRO ENVIO:", e.response?.data || e.message);
    }
}

// ===============================================
// 🔥 SERVIDOR
// ===============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
    console.log("🔥 Servidor rodando na porta " + PORT)
);
