const axios = require("axios");
require("dotenv").config();

const ZAPI_NUMBER = process.env.ZAPI_NUMBER;
const ZAPI_TOKEN = process.env.ZAPI_TOKEN;
const ZAPI_CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN;

async function sendText(phone, message) {
    if (phone.endsWith("@g.us") || phone.includes("-group")) return;

    try {
        await axios.post(
            `https://api.z-api.io/instances/${ZAPI_NUMBER}/token/${ZAPI_TOKEN}/send-text`,
            { phone, message },
            { headers: { "Client-Token": ZAPI_CLIENT_TOKEN } }
        );
    } catch (e) {
        console.log("Erro sendText:", e.response?.data || e.message);
    }
}

module.exports = { sendText };
