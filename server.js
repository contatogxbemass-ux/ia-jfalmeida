require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

// ===============================
// CONFIGURAÇÕES BASE
// ===============================
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ===============================
// ROTAS
// ===============================
const webhookRoutes = require("./src/routes/webhook.routes");

// Rota de saúde
app.get("/", (req, res) => {
  res.send("JF Almeida Bot — Online");
});

// Webhook
app.use("/webhook", webhookRoutes);

// ===============================
// SERVIDOR
// ===============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔥 Servidor rodando na porta ${PORT}`);
});
