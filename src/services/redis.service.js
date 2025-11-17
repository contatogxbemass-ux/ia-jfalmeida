const Redis = require("ioredis");

// Conexão com Redis (Upstash / Render)
const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const SESSION_TTL = 60 * 60 * 24; // 24h

function sessionKey(phone) {
  return `session:${phone}`;
}

async function getSession(phone) {
  if (!phone) throw new Error("Telefone é obrigatório na sessão");

  const key = sessionKey(phone);
  const raw = await redis.get(key);

  if (!raw) {
    const initial = {
      etapa: "menu",
      dados: {},
      lastMessageId: null,
      paused: false,
      silencio: false,
    };

    await redis.set(key, JSON.stringify(initial), "EX", SESSION_TTL);
    return initial;
  }

  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("Erro ao parsear sessão, resetando:", e.message);
    await redis.del(key);
    const initial = {
      etapa: "menu",
      dados: {},
      lastMessageId: null,
      paused: false,
      silencio: false,
    };
    await redis.set(key, JSON.stringify(initial), "EX", SESSION_TTL);
    return initial;
  }
}

async function updateSession(phone, data) {
  if (!phone) throw new Error("Telefone é obrigatório na sessão");

  const key = sessionKey(phone);
  const current = await getSession(phone);
  const updated = { ...current, ...data };

  await redis.set(key, JSON.stringify(updated), "EX", SESSION_TTL);
  return updated;
}

async function resetSession(phone) {
  if (!phone) throw new Error("Telefone é obrigatório na sessão");

  const key = sessionKey(phone);
  const initial = {
    etapa: "menu",
    dados: {},
    lastMessageId: null,
    paused: false,
    silencio: false,
  };

  await redis.set(key, JSON.stringify(initial), "EX", SESSION_TTL);
  return initial;
}

module.exports = {
  redis,
  getSession,
  updateSession,
  resetSession,
};
