function loggerMiddleware(req, res, next) {
  console.log("📩 RECEBIDO DO Z-API:", JSON.stringify(req.body, null, 2));
  next();
}

export default loggerMiddleware;
