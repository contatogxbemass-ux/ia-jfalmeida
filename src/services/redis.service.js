import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL, {
  tls: { rejectUnauthorized: false }
});

function sessionKey(phone) {
  return `session:${phone}`;
}

export async function getSession(phone) {
  const key = sessionKey(phone);
  const raw = await redis.get(key);

  if (!raw) {
    const session = {
      etapa: "menu",
      dados: {},
      paused: false
    };
    await redis.set(key, JSON.stringify(session));
    return session;
  }

  return JSON.parse(raw);
}

export async function updateSession(phone, newData) {
  const key = sessionKey(phone);
  const current = await getSession(phone);
  const updated = { ...current, ...newData };
  await redis.set(key, JSON.stringify(updated));
  return updated;
}

export async function resetSession(phone) {
  const key = sessionKey(phone);
  await redis.del(key);
}

export default {
  getSession,
  updateSession,
  resetSession
};
