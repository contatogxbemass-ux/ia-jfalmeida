const axios = require("axios");
require("dotenv").config();

const ZAPI_NUMBER = process.env.ZAPI_NUMBER;
const ZAPI_TOKEN = process.env.ZAPI_TOKEN;
const ZAPI_CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN;

async function sendText(phone, message) {
  try {
    if (phone.includes("-group") || phone.endsWith("@g.us")) return;

    await axios.post(
      `https://api.z-api.io/instances/${ZAPI_NUMBER}/token/${ZAPI_TOKEN}/send-text`,
      { phone, message },
      { headers: { "Client-Token": ZAPI_CLIENT_TOKEN } }
    );
  } catch (err) {
    console.log("Erro ao enviar:", err.response?.data || err.message);
  }
}

module.exports = { sendText };
