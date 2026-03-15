const webpack = require("webpack");

module.exports = function override(config) {

  config.resolve.fallback = {
    fs: false,
    util: require.resolve("util/"),
    buffer: require.resolve("buffer/"),
    stream: require.resolve("stream-browserify"),
    crypto: require.resolve("crypto-browserify"),
    assert: require.resolve("assert/"),
    vm: require.resolve("vm-browserify"),
    process: require.resolve("process/browser"),
    path: require.resolve("path-browserify"),
    zlib: require.resolve("browserify-zlib")
  };

  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    process: "process/browser"
  };

  config.plugins.push(
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
      process: "process/browser"
    })
  );

  return config;
};