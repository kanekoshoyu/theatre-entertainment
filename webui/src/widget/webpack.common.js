var webpack = require("webpack");

var config = {
  resolve: {
    extensions: ['.js', '.ts']
  },
  entry: {
    "app": "./app/index.ts"
  },
  output: {
    path: __dirname + "/dist",
    publicPath: "dist/",
    filename: "bundle.js"
  },
  devtool: "source-map",
  module: {
    rules: [{
      test: /\.ts$/,
      loaders: 'ts-loader',
      exclude: ["/node_modules/", /\.spec\.ts$/]
    }, {
      test: /\.html$/,
      loaders: 'raw-loader',
      include: [__dirname + "./app"]
    }]
  },
  plugins: [
    new webpack.ContextReplacementPlugin(
      // The (\\|\/) piece accounts for path separators in *nix and Windows
      /angular(\\|\/)core(\\|\/)(esm(\\|\/)src|src)(\\|\/)linker/,
      __dirname + "./app" // location of your src
    )
  ]
};
module.exports = config;