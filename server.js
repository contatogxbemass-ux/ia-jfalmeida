import express from "express";
import bodyParser from "body-parser";

import loggerMiddleware from "./src/middlewares/logger.middleware.js";
import rateLimitMiddleware from "./src/middlewares/rateLimit.middleware.js";
import commandsMiddleware from "./src/middlewares/commands.middleware.js";
import pauseMiddleware from "./src/middlewares/pause.middleware.js";
import routerMiddleware from "./src/middlewares/router.middleware.js";

import webhookRoutes from "./src/routes/webhook.routes.js";

const app = express();
app.use(bodyParser.json());

app.use(loggerMiddleware);
app.use(rateLimitMiddleware);
app.use(commandsMiddleware);
app.use(pauseMiddleware);
app.use(routerMiddleware);

app.use("/", webhookRoutes);

app.listen(process.env.PORT || 10000, () => {
  console.log("Servidor rodando");
});
