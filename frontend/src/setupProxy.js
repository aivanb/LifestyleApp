const { createProxyMiddleware } = require('http-proxy-middleware');

/**
 * Dev-server proxy: local default targets host MySQL/Django; Docker sets DOCKER_API_PROXY.
 * Do not proxy /static — CRA serves webpack assets at /static/js/bundle.js etc.; forwarding
 * /static to Django breaks the dev app with 404 on the bundle. Use :8000/admin for Django admin.
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
