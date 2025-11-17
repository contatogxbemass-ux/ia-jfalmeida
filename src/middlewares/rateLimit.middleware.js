function rateLimitMiddleware(req, res, next) {
  try {
    // Aqui você pode aplicar limites reais depois
    // Por enquanto só deixa passar
  } catch (err) {
    console.log("Erro no rateLimitMiddleware:", err);
  }

  next(); // OBRIGATÓRIO NO EXPRESS
}

export default rateLimitMiddleware;
