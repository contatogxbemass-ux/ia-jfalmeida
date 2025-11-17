const Redis = require("ioredis");

// Conexão com Redis
const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// TTLs
const SESSION_TTL = 86400;      // 24h para sessão
const TENANT_MAP_TTL = 86400;   // 24h para mapa telefone -> tenant

// ===============================
// Helpers internos
// ===============================

function sessionKey(tenantId, phone) {
  return `session:${tenantId}:${phone}`;
}

function tenantKey(phone) {
  return `tenant:${phone}`;
}

// ===============================
// Registrar telefone -> tenant (instanceId)
// ===============================

async function setTenantForPhone(phone, tenantId) {
  if (!phone || !tenantId) return;
  await redis.set(tenantKey(phone), tenantId, "EX", TENANT_MAP_TTL);
}

async function getTenantForPhone(phone) {
  const t = await redis.get(tenantKey(phone));
  return t || "default";
}

// ===============================
// Sessão multi-tenant por instanceId
// ===============================

async function getSession(phone, tenantId) {
  if (!tenantId) tenantId = await getTenantForPhone(phone);

  const key = sessionKey(tenantId, phone);
  const raw = await redis.get(key);

  if (!raw) {
    const initialState = {
      etapa: "menu",
      dados: {},
      lastMessageId: null,
      paused: false,
      silencio: false,
    };

    await redis.set(key, JSON.stringify(initialState), "EX", SESSION_TTL);
    return initialState;
  }

  return JSON.parse(raw);
}

async function updateSession(phone, data, tenantId) {
  if (!tenantId) tenantId = await getTenantForPhone(phone);

  const current = await getSession(phone, tenantId);
  const updated = { ...current, ...data };

  const key = sessionKey(tenantId, phone);
  await redis.set(key, JSON.stringify(updated), "EX", SESSION_TTL);

  return updated;
}

async function resetSession(phone, tenantId) {
  if (!tenantId) tenantId = await getTenantForPhone(phone);

  const initialState = {
    etapa: "menu",
    dados: {},
    lastMessageId: null,
    paused: false,
    silencio: false,
  };

  await redis.set(sessionKey(tenantId, phone), JSON.stringify(initialState), "EX", SESSION_TTL);
  return initialState;
}

module.exports = {
  redis,
  getSession,
  updateSession,
  resetSession,
  setTenantForPhone,
  getTenantForPhone,
};
