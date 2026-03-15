const webpack = require("webpack");

module.exports = function override(config) {

  config.resolve.fallback = {
    fs: false,
    util: require.resolve("util/"),
    buffer: require.resolve("buffer/"),
    stream: require.resolve("stream-browserify"),
    crypto: require.resolve("crypto-browserify"),
    assert: require.resolve("assert/"),
    vm: require.resolve("vm-browserify")
  };

  config.plugins.push(
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
      process: "process/browser"
    })
  );

  return config;
};