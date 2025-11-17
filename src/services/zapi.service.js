const axios = require("axios");
require("dotenv").config();

const ZAPI_NUMBER = process.env.ZAPI_NUMBER;
const ZAPI_TOKEN = process.env.ZAPI_TOKEN;
const ZAPI_CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN;

/**
 * Envia texto simples
 */
async function sendText(phone, message) {
    if (!phone || phone.includes("-group") || phone.endsWith("@g.us")) {
        console.log("⛔ Bloqueado envio para grupo:", phone);
        return;
    }

    try {
        await axios.post(
            `https://api.z-api.io/instances/${ZAPI_NUMBER}/token/${ZAPI_TOKEN}/send-text`,
            { phone, message },
            { headers: { "Client-Token": ZAPI_CLIENT_TOKEN } }
        );

    } catch (err) {
        console.log("❌ Erro sendText:", err.response?.data || err.message);
    }
}

module.exports = {
    sendText
};
