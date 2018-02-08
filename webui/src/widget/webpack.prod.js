var webpack = require("webpack");
var webpackMerge = require('webpack-merge');
var commonConfig = require("./webpack.common.js");

var config = {
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: false,
      mangle: true,
      comments: false
    }),
    new webpack.DefinePlugin({
      "process.env": {
        "ENV": '"production"'
      }
    })
  ]
};
module.exports = webpackMerge(commonConfig, config);