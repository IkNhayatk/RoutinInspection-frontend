const webpack = require('webpack');

module.exports = function override(config, env) {
  const fallback = config.resolve.fallback || {};
  Object.assign(fallback, {
    "http": require.resolve("stream-http"),
    "https": require.resolve("https-browserify"),
    "util": require.resolve("util/"),
    "zlib": require.resolve("browserify-zlib"),
    "stream": require.resolve("stream-browserify"),
    "url": require.resolve("url/"),
    "crypto": require.resolve("crypto-browserify"),
    "assert": require.resolve("assert/")
  });
  config.resolve.fallback = fallback;
  
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer']
    })
  ]);
  
  return config;
};

module.exports.devServer = function(configFunction) {
  return function(proxy, allowedHost) {
    const config = configFunction(proxy, allowedHost);
    
    // Fix deprecated middleware options
    config.setupMiddlewares = (middlewares, devServer) => {
      // Execute any existing onBeforeSetupMiddleware logic
      if (config.onBeforeSetupMiddleware) {
        config.onBeforeSetupMiddleware(devServer);
      }
      
      // Execute any existing onAfterSetupMiddleware logic
      if (config.onAfterSetupMiddleware) {
        config.onAfterSetupMiddleware(devServer);
      }
      
      return middlewares;
    };
    
    // Remove deprecated options
    delete config.onBeforeSetupMiddleware;
    delete config.onAfterSetupMiddleware;
    
    return config;
  };
};
