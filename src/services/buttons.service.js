const axios = require("axios");
require("dotenv").config();

const ZAPI_NUMBER = process.env.ZAPI_NUMBER;
const ZAPI_TOKEN = process.env.ZAPI_TOKEN;
const ZAPI_CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN;

async function sendButtons(phone, title, buttons) {
  try {

    // bloqueio absoluto de grupos
    if (!phone || phone.includes("-group") || phone.endsWith("@g.us")) {
      console.log("⛔ Tentativa de envio de botões para grupo bloqueada:", phone);
      return;
    }

    await axios.post(
      `https://api.z-api.io/instances/${ZAPI_NUMBER}/token/${ZAPI_TOKEN}/send-button-message`,
      {
        phone,
        message: title,
        buttons
      },
      {
        headers: {
          "Client-Token": ZAPI_CLIENT_TOKEN
        }
      }
    );

  } catch (e) {
    console.log("❌ ERRO AO ENVIAR BOTÕES:", e.response?.data || e.message);
  }
}

module.exports = { sendButtons };
