require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

// Configurações base
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Rotas
const webhookRoutes = require("./src/routes/webhook.routes");

// Saúde
app.get("/", (req, res) => {
  res.send("JF Almeida Bot — Online");
});

// Webhook
app.use("/webhook", webhookRoutes);

// Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🔥 Servidor rodando na porta " + PORT);
});
