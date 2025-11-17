import { getSession } from "../services/redis.service.js";

async function pauseMiddleware(req, res, next) {
  try {
    const phone = req.body?.phone;
    if (!phone) return next();

    const session = await getSession(phone);

    if (session.paused) {
      return res.json({ ok: true, paused: true });
    }

    next();
  } catch (err) {
    console.log("Erro no pauseMiddleware:", err);
    next();
  }
}

export default pauseMiddleware;
