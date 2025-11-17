const express = require("express");
require("dotenv").config();

const webhookRoutes = require("./src/routes/webhook.routes");

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Rotas
app.use("/", webhookRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🔥 Servidor rodando na porta " + PORT);
});
