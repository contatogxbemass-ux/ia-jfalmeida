const rateLimitMiddleware = async (ctx, next) => {
  return next();
};

export default rateLimitMiddleware;
