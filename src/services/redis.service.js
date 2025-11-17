import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL, {
  tls: {
    rejectUnauthorized: false
  }
});

// -------------------------
// GET Async simples
// -------------------------
export async function getAsync(key) {
  const data = await redis.get(key);
  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

// -------------------------
// SET Async simples
// -------------------------
export async function setAsync(key, value) {
  return redis.set(key, JSON.stringify(value));
}

// -------------------------
// DELETE chave
// -------------------------
export async function delAsync(key) {
  return redis.del(key);
}

// -------------------------
// SESSÕES POR TELEFONE
// -------------------------
function sessionKey(phone) {
  return `session:${phone}`;
}

export async function getSession(phone) {
  const key = sessionKey(phone);
  const raw = await redis.get(key);

  if (!raw) {
    const initial = {
      etapa: "menu",
      dados: {},
      lastMessageId: null,
      paused: false
    };

    await redis.set(key, JSON.stringify(initial));
    return initial;
  }

  try {
    return JSON.parse(raw);
  } catch {
    await redis.del(key);
    const initial = {
      etapa: "menu",
      dados: {},
      lastMessageId: null,
      paused: false
    };
    await redis.set(key, JSON.stringify(initial));
    return initial;
  }
}

export async function updateSession(phone, data) {
  const current = await getSession(phone);
  const updated = { ...current, ...data };
  await redis.set(sessionKey(phone), JSON.stringify(updated));
  return updated;
}

export async function resetSession(phone) {
  const initial = {
    etapa: "menu",
    dados: {},
    lastMessageId: null,
    paused: false
  };

  await redis.set(sessionKey(phone), JSON.stringify(initial));
  return initial;
}

// EXPORT DEFAULT (para middlewares)
export default {
  getAsync,
  setAsync,
  delAsync,
  getSession,
  updateSession,
  resetSession
};
