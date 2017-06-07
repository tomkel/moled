const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const DashboardPlugin = require('webpack-dashboard/plugin')

module.exports = (env = {}) => {
  const plugins = [new HtmlWebpackPlugin({ title: 'moled' })]
  const entry = ['./src/main']

  if (env.production) {
    entry.unshift('babel-polyfill')
  } else {
    plugins.push(new DashboardPlugin())
  }

  return {
    entry,
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'dist'),
    },
    module: {
      rules: [
        { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' },
      ],
    },
    plugins,
  }
}
