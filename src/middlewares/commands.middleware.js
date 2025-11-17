import { getSession, updateSession, delAsync } from "../services/redis.service.js";

async function commandsMiddleware(req, res, next) {
  try {
    const body = req.body;
    if (!body || !body.text || !body.phone) {
      return next();
    }

    const msg = body.text.message?.trim()?.toLowerCase();
    const phone = body.phone;

    if (!msg) return next();

    // /pausar
    if (msg === "/pausar") {
      await updateSession(phone, { paused: true });
      return res.json({ status: "OK" });
    }

    // /voltar
    if (msg === "/voltar") {
      await updateSession(phone, { paused: false });
      return res.json({ status: "OK" });
    }

    // limpar sessão
    if (msg === "/resetar") {
      await delAsync(`session:${phone}`);
      return res.json({ status: "sessão resetada" });
    }

    return next();
  } catch (err) {
    console.log("Erro no commandsMiddleware:", err);
    return next();
  }
}

export default commandsMiddleware;
