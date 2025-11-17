import { updateSession, resetSession } from "../services/redis.service.js";

async function commandsMiddleware(req, res, next) {
  try {
    const phone = req.body?.phone;
    const msg = req.body?.text?.message?.trim()?.toLowerCase();

    if (!phone || !msg) return next();

    if (msg === "/pausar") {
      await updateSession(phone, { paused: true });
      return res.json({ ok: true });
    }

    if (msg === "/voltar") {
      await updateSession(phone, { paused: false });
      return res.json({ ok: true });
    }

    if (msg === "/resetar") {
      await resetSession(phone);
      return res.json({ ok: true });
    }

    next();
  } catch (err) {
    console.log("Erro em commandsMiddleware:", err);
    next();
  }
}

export default commandsMiddleware;
