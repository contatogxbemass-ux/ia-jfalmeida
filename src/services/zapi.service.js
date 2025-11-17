const axios = require("axios");

const ZAPI_NUMBER = process.env.ZAPI_NUMBER;
const ZAPI_TOKEN = process.env.ZAPI_TOKEN;
const ZAPI_CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN;

/**
 * Envia mensagens para o WhatsApp (texto + replyButtons)
 */
async function sendMessage(telefone, texto, replyButtons = null) {
    try {

        // BLOQUEIO ABSOLUTO PARA GRUPOS
        if (telefone.includes("-group") || telefone.includes("@g.us")) {
            console.log("⛔ Tentativa de envio para grupo bloqueada:", telefone);
            return;
        }

        const payload = {
            phone: telefone,
            message: texto
        };

        // Se houver botões
        if (Array.isArray(replyButtons) && replyButtons.length > 0) {
            payload.replyButtons = replyButtons;
        }

        await axios.post(
            `https://api.z-api.io/instances/${ZAPI_NUMBER}/token/${ZAPI_TOKEN}/send-text`,
            payload,
            { headers: { "Client-Token": ZAPI_CLIENT_TOKEN } }
        );

    } catch (err) {
        console.log("❌ Erro ao enviar mensagem:", err.response?.data || err.message);
    }
}

module.exports = {
    sendMessage
};
