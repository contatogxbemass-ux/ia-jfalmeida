import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL, {
  tls: {
    rejectUnauthorized: false,
  },
});

// GET
export async function getAsync(key) {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

// SET
export async function setAsync(key, value) {
  return redis.set(key, JSON.stringify(value));
}

// DEL
export async function delAsync(key) {
  return redis.del(key);
}

export default {
  getAsync,
  setAsync,
  delAsync,
};
