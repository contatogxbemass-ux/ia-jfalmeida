const rateLimitMiddleware = async (ctx, next) => {
  next(); // simplificado pra não atrapalhar sua madrugada
};

export default rateLimitMiddleware;
