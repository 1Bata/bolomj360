import { defineConfig } from "@rspack/cli";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const uiRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  mode: "development",
  entry: { standalone: "./src/standalone.tsx" },
  output: {
    path: resolve(uiRoot, "dist-standalone"),
    filename: "[name].js",
    publicPath: "/",
    clean: true,
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: { "~": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "builtin:swc-loader",
        options: {
          jsc: {
            parser: { syntax: "typescript", tsx: true },
            transform: { react: { runtime: "automatic" } },
          },
        },
      },
      { test: /\.css$/, use: ["style-loader", "css-loader", "postcss-loader"] },
    ],
  },
  devServer: {
    port: 3100,
    static: { directory: resolve(uiRoot, "standalone") },
    historyApiFallback: true,
    allowedHosts: "all",
  },
});
