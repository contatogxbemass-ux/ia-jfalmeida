function loggerMiddleware(req, res, next) {
  try {
    const body = req.body || {};
    console.log("📩 RECEBIDO DO Z-API:", JSON.stringify(body, null, 2));
  } catch (err) {
    console.log("ERRO AO LOGAR:", err);
  }

  next();
}

export default loggerMiddleware;
