const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Z-API
const ZAPI_NUMBER = process.env.ZAPI_NUMBER;
const ZAPI_TOKEN = process.env.ZAPI_TOKEN;
const ZAPI_CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN;

// OpenAI
const OPENAI_KEY = process.env.OPENAI_KEY;

// Estados dos usuários
const estados = {}; 
// estados[telefone] = { stage: "menu" | "fluxo_compra" | "fluxo_venda" | "fluxo_financiamento" | "fluxo_listagem" | "aguardando_corretor", lastMessage: string }

app.post("/webhook", async (req, res) => {
    const msg = req.body?.text?.message;
    const telefone = req.body?.phone;

    if (!telefone || !msg) return res.sendStatus(200);

    if (!estados[telefone]) {
        estados[telefone] = { stage: "menu", lastMessage: null };
    }

    const estado = estados[telefone];

    // Evita spam
    if (estado.lastMessage === msg) return res.sendStatus(200);
    estado.lastMessage = msg;

    const txt = msg.trim().toLowerCase();

    // BOT MUDA (corretor humano ativo)
    if (estado.stage === "aguardando_corretor") return res.sendStatus(200);

    // Comando global MENU
    if (txt === "menu") {
        estado.stage = "menu";
        await enviarMensagemWhatsApp(telefone, menuPrincipal());
        return res.sendStatus(200);
    }

    // MENU PRINCIPAL
    if (estado.stage === "menu") {
        if (msg === "1") {
            estado.stage = "fluxo_compra";
            return enviarMensagemWhatsApp(
                telefone,
                "Perfeito! Para te ajudar a encontrar o imóvel ideal, envie **TUDO em uma única mensagem** respondendo:\n\n" +
                "1️⃣ Tipo do imóvel\n" +
                "2️⃣ Região desejada\n" +
                "3️⃣ Orçamento máximo\n" +
                "4️⃣ Forma de pagamento (financiado/à vista)\n" +
                "5️⃣ Urgência (baixa, média ou alta)"
            ).then(() => res.sendStatus(200));
        }

        if (msg === "2") {
            estado.stage = "fluxo_venda";
            return enviarMensagemWhatsApp(
                telefone,
                "Ótimo! Para te ajudar a vender seu imóvel, me envie **TUDO em uma única mensagem**:\n\n" +
                "1️⃣ Tipo do imóvel\n" +
                "2️⃣ Localização (bairro)\n" +
                "3️⃣ Tamanho / n° de quartos\n" +
                "4️⃣ Estado de conservação\n" +
                "5️⃣ Valor desejado"
            ).then(() => res.sendStatus(200));
        }

        if (msg === "3") {
            estado.stage = "fluxo_financiamento";
            return enviarMensagemWhatsApp(
                telefone,
                "Claro! Para analisar seu financiamento, envie **TUDO em uma única mensagem**:\n\n" +
                "1️⃣ Renda mensal\n" +
                "2️⃣ Valor disponível para entrada\n" +
                "3️⃣ Tipo do imóvel\n" +
                "4️⃣ Cidade\n" +
                "5️⃣ Tipo de financiamento (se souber)"
            ).then(() => res.sendStatus(200));
        }

        if (msg === "4") {
            estado.stage = "fluxo_listagem";
            return enviarMensagemWhatsApp(
                telefone,
                "Perfeito! Para te mostrar os imóveis disponíveis, envie **TUDO em uma única mensagem**:\n\n" +
                "1️⃣ Tipo do imóvel\n" +
                "2️⃣ Bairro/região\n" +
                "3️⃣ Preço máximo\n" +
                "4️⃣ Número de quartos\n" +
                "5️⃣ Finalidade (moradia/investimento)"
            ).then(() => res.sendStatus(200));
        }

        if (msg === "0") {
            estado.stage = "aguardando_corretor";
            return enviarMensagemWhatsApp(
                telefone,
                "📞 Perfeito! Vou te conectar com um corretor humano.\n\n" +
                "Por favor, envie:\n" +
                "• Seu nome completo\n" +
                "• Melhor horário para contato\n" +
                "• Assunto (compra, venda, dúvida…)\n\n" +
                "Assim que você enviar, um corretor te chama aqui. 🙂"
            ).then(() => res.sendStatus(200));
        }

        await enviarMensagemWhatsApp(telefone, menuPrincipal());
        return res.sendStatus(200);
    }

    // FLUXOS QUE USAM IA PARA RESUMIR E ENCAMINHAR AO CORRETOR
    if ([
        "fluxo_compra",
        "fluxo_venda",
        "fluxo_financiamento",
        "fluxo_listagem"
    ].includes(estado.stage)) {

        const resumo = await gerarResumoIA(estado.stage, msg);

        await enviarMensagemWhatsApp(telefone, resumo);

        await enviarMensagemWhatsApp(
            telefone,
            "Prontinho! Já encaminhei suas informações para um corretor da JF Almeida.\n" +
            "Ele vai te chamar em instantes. 🙂"
        );

        estado.stage = "aguardando_corretor";
        return res.sendStatus(200);
    }

    return res.sendStatus(200);
});


// ===============================================
// 🔥 FUNÇÃO MENU
// ===============================================
function menuPrincipal() {
    return (
        "👋 *Bem-vindo(a) à JF Almeida Imóveis!*\n\n" +
        "Escolha uma opção:\n\n" +
        "1️⃣ Quero comprar um imóvel\n" +
        "2️⃣ Quero vender meu imóvel\n" +
        "3️⃣ Quero saber sobre financiamentos\n" +
        "4️⃣ Ver imóveis disponíveis\n" +
        "0️⃣ Falar com um corretor"
    );
}


// ===============================================
// 🔥 IA – GERA RESUMO DAS RESPOSTAS
// ===============================================
async function gerarResumoIA(fluxo, msg) {
    const prompt = `
Organize essas informações do cliente em um texto bonito e profissional.
Fluxo: ${fluxo}
Respostas do cliente: ${msg}

Formato:
- Título da área (ex: Compra de imóvel)
- Lista organizada e clara das informações
- Fechar agradecendo com formalidade
    `;

    try {
        const r = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "Organize respostas como um atendente profissional da JF Almeida." },
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
        console.log("ERRO IA:", e.message);
        return "Recebemos suas informações.";
    }
}


// ===============================================
// 🔥 ENVIO Z-API
// ===============================================
async function enviarMensagemWhatsApp(telefone, texto) {
    try {
        const r = await axios.post(
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

app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
