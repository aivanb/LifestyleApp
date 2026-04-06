const { createProxyMiddleware } = require('http-proxy-middleware');

/**
 * Dev-server proxy: local default targets host MySQL/Django; Docker sets DOCKER_API_PROXY.
 */
module.exports = function setupProxy(app) {
  const target = process.env.DOCKER_API_PROXY || 'http://127.0.0.1:8000';
  app.use(
    ['/api', '/admin'],
    createProxyMiddleware({
      target,
      changeOrigin: true,
    }),
  );
};
