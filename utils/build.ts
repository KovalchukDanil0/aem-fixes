import path from "path";
import webpack, { WebpackPluginInstance } from "webpack";
import ZipPlugin from "zip-webpack-plugin";
import packageInfo from "../package.json";
import webpackConfig from "../webpack.config";

webpackConfig.mode = "production";

webpackConfig.plugins?.push(
  new ZipPlugin({
    filename: `${packageInfo.name}-${packageInfo.version}.zip`,
    path: path.join("", "../", "zip"),
  }) as unknown as WebpackPluginInstance,
);

webpack(webpackConfig, function (err) {
  if (err) {
    throw err;
  }
});
