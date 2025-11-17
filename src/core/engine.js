const {
  getSession,
  updateSession,
  resetSession,
  setTenantForPhone,
} = require("../services/redis.service");

const { sendText } = require("../services/zapi.service");

const loggerMiddleware = require("../middlewares/logger.middleware");
const rateLimitMiddleware = require("../middlewares/rateLimit.middleware");
const commandsMiddleware = require("../middlewares/commands.middleware");
const pauseMiddleware = require("../middlewares/pause.middleware");
const routerMiddleware = require("../middlewares/router.middleware");

// Runner em cadeia
async function runMiddlewares(ctx, middlewares, index = 0) {
  if (index >= middlewares.length) return;
  const next = () => runMiddlewares(ctx, middlewares, index + 1);
  await middlewares[index](ctx, next);
}

async function handleWebhook(req, res) {
  console.log("📩 RECEBIDO DO Z-API:", JSON.stringify(req.body, null, 2));

  const userPhone = req.body.phone;
  const instanceId = req.body.instanceId; // tenantId real
  const msgRaw = req.body.text?.message || "";
  const msg = msgRaw.trim();

  if (!userPhone || !instanceId) return res.sendStatus(200);

  // Registrar telefone → tenant
  await setTenantForPhone(userPhone, instanceId);

  // Carregar sessão multi-tenant
  let state = await getSession(userPhone, instanceId);

  // Anti duplicidade
  if (state.lastMessageId === req.body.messageId) {
    return res.sendStatus(200);
  }

  state = await updateSession(
    userPhone,
    { lastMessageId: req.body.messageId },
    instanceId
  );

  // Contexto
  const ctx = {
    req,
    res,
    phone: userPhone,
    tenantId: instanceId,  
    msg,
    msgLower: msg.toLowerCase(),
    state,

    async send(text) {
      await sendText(this.phone, text);
    },

    async setState(data) {
      this.state = await updateSession(this.phone, data, this.tenantId);
    },

    async resetState() {
      this.state = await resetSession(this.phone, this.tenantId);
    },
  };

  const middlewares = [
    loggerMiddleware,
    rateLimitMiddleware,
    commandsMiddleware,
    pauseMiddleware,
    routerMiddleware,
  ];

  try {
    await runMiddlewares(ctx, middlewares);
  } catch (err) {
    console.error("💥 FALHA NA ENGINE:", err);
    await ctx.send("Erro interno. Digite *menu*.");
    await ctx.resetState();
  }

  return res.sendStatus(200);
}

module.exports = { handleWebhook };
