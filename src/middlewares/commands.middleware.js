import { updateSession, resetSession } from "../services/redis.service.js";

async function commandsMiddleware(req, res, next) {
  try {
    const body = req.body;
    const phone = body?.phone;
    const msg = body?.text?.message?.trim()?.toLowerCase();

    if (!phone || !msg) return next();

    // PAUSAR O BOT
    if (msg === "/pausar") {
      await updateSession(phone, { paused: true });
      return res.json({ ok: true });
    }

    // VOLTAR O BOT
    if (msg === "/voltar") {
      await updateSession(phone, { paused: false });
      return res.json({ ok: true });
    }

    // RESETAR SESSÃO
    if (msg === "/resetar") {
      await resetSession(phone);
      return res.json({ ok: true });
    }

    next();
  } catch (e) {
    console.log("Erro no commandsMiddleware:", e);
    next();
  }
}

export default commandsMiddleware;
