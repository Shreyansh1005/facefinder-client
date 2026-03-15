const webpack = require("webpack");

module.exports = {
  webpack: {
    configure: (config) => {

      config.resolve.fallback = {
        fs: false,
        util: require.resolve("util/"),
        buffer: require.resolve("buffer/"),
        stream: require.resolve("stream-browserify"),
        crypto: require.resolve("crypto-browserify"),
        assert: require.resolve("assert/"),
        vm: require.resolve("vm-browserify"),
        process: require.resolve("process/browser.js"),
        path: require.resolve("path-browserify"),
        zlib: require.resolve("browserify-zlib")
      };

      config.plugins.push(
        new webpack.ProvidePlugin({
          process: "process/browser.js",
          Buffer: ["buffer", "Buffer"],
        })
      );

      return config;
    }
  }
};