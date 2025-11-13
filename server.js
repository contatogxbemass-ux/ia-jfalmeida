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
// 🔥 ESTADOS DOS USUÁRIOS
// ===============================================
const estados = {}; 
// estados[telefone] = { stage: "...", lastMessage: "..." }

// ===============================================
// 🔥 WEBHOOK
// ===============================================
app.post("/webhook", async (req, res) => {
    console.log("📩 RECEBIDO DO Z-API:", req.body);

    const telefone = req.body.phone;
    const msg = req.body.text?.message; // <<<<<<  ESSA É A CORREÇÃO PRINCIPAL

    if (!telefone || !msg || msg.trim() === "") {
        console.log("⚠️ Ignorado: mensagem sem telefone ou conteúdo");
        return res.sendStatus(200);
    }

    // Inicia estado se primeira mensagem
    if (!estados[telefone]) {
        estados[telefone] = { stage: "menu", lastMessage: null };
    }

    const estado = estados[telefone];

    // Anti-spam
    if (estado.lastMessage === msg) return res.sendStatus(200);
    estado.lastMessage = msg;

    const txt = msg.trim().toLowerCase();

    // Cliente já está com corretor humano
    if (estado.stage === "aguardando_corretor") {
        console.log("👤 Cliente aguardando corretor, bot não responde.");
        return res.sendStatus(200);
    }

    // Comando global MENU
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
                "Perfeito! Envie **tudo em uma única mensagem**:\n\n" +
                "1️⃣ Tipo do imóvel\n" +
                "2️⃣ Região desejada\n" +
                "3️⃣ Orçamento máximo\n" +
                "4️⃣ Tipo de pagamento\n" +
                "5️⃣ Urgência"
            ).then(() => res.sendStatus(200));
        }

        if (msg === "2") {
            estado.stage = "fluxo_venda";
            return enviarMensagemWhatsApp(
                telefone,
                "Ótimo! Envie **tudo em uma única mensagem**:\n\n" +
                "1️⃣ Tipo do imóvel\n" +
                "2️⃣ Localização\n" +
                "3️⃣ Quartos / tamanho\n" +
                "4️⃣ Estado de conservação\n" +
                "5️⃣ Valor desejado"
            ).then(() => res.sendStatus(200));
        }

        if (msg === "3") {
            estado.stage = "fluxo_financiamento";
            return enviarMensagemWhatsApp(
                telefone,
                "Envie **tudo em uma única mensagem**:\n\n" +
                "1️⃣ Sua renda mensal\n" +
                "2️⃣ Entrada disponível\n" +
                "3️⃣ Tipo do imóvel\n" +
                "4️⃣ Cidade\n" +
                "5️⃣ Tipo de financiamento (se souber)"
            ).then(() => res.sendStatus(200));
        }

        if (msg === "4") {
            estado.stage = "fluxo_listagem";
            return enviarMensagemWhatsApp(
                telefone,
                "Envie **tudo em uma única mensagem**:\n\n" +
                "1️⃣ Tipo do imóvel\n" +
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
                "📞 Certo! Vou te conectar com um corretor humano.\n\n" +
                "Envie por favor:\n" +
                "• Seu nome completo\n" +
                "• Melhor horário para contato\n" +
                "• Assunto (compra, venda, financiamento)\n\n" +
                "Assim que enviar, o corretor te chama! 🙂"
            ).then(() => res.sendStatus(200));
        }

        // Resposta inválida → mostra menu de novo
        await enviarMensagemWhatsApp(telefone, menuPrincipal());
        return res.sendStatus(200);
    }

    // ===============================================
    // 🔥 FLUXOS QUE FINALIZAM E ENVIAM PARA CORRETOR
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
            "Perfeito! Encaminhei tudo para o corretor.\nEle vai te chamar em instantes. 🙂"
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
        "3️⃣ Financiamento\n" +
        "4️⃣ Ver imóveis disponíveis\n" +
        "0️⃣ Falar com um corretor"
    );
}

// ===============================================
// 🔥 IA – RESUMO
// ===============================================
async function gerarResumoIA(fluxo, msg) {
    const prompt = `
Organize de forma profissional as informações do cliente.
Fluxo: ${fluxo}
Respostas do cliente: ${msg}

Formato:
- Título do fluxo
- Lista organizada
- Agradecimento final
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
        return "Recebi suas informações e já enviei ao corretor!";
    }
}

// ===============================================
// 🔥 FUNÇÃO: ENVIO DE MENSAGEM VIA Z-API
// ===============================================
async function enviarMensagemWhatsApp(telefone, texto) {
    try {
        await axios.post(
            `https://api.z-api.io/instances/${ZAPI_NUMBER}/token/${ZAPI_TOKEN}/send-text`,
            {
                phone: telefone,
                message: texto
            },
            {
                headers: { "Client-Token": ZAPI_CLIENT_TOKEN }
            }
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