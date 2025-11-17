import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL, {
  tls: {
    rejectUnauthorized: false
  }
});

// Salva valor simples
export async function setAsync(key, value) {
  return redis.set(key, JSON.stringify(value));
}

// Busca valor simples
export async function getAsync(key) {
  const result = await redis.get(key);
  if (!result) return null;
  try {
    return JSON.parse(result);
  } catch {
    return result;
  }
}

// Remove chave
export async function delAsync(key) {
  return redis.del(key);
}

export default {
  setAsync,
  getAsync,
  delAsync
};
