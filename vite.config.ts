import { crx } from "@crxjs/vite-plugin";
import react from "@vitejs/plugin-react-swc";
import { readFile, writeFile } from "fs/promises";
import { resolve } from "path";
import { defineConfig, Plugin, ResolvedConfig } from "vite";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";
import { ViteMinifyPlugin } from "vite-plugin-minify";
import zipPack from "vite-plugin-zip-pack";
import tsconfigPaths from "vite-tsconfig-paths";
import manifest from "./manifest.config";
import { name, version } from "./package.json";
import rollupOptions from "./rollup.config";

const isWatch = process.argv.includes("--watch");

function fixManifest({
  object,
  property,
}: {
  object: { resources: string[]; matches: string[] }[];
  property: string;
}): Plugin {
  let config: ResolvedConfig;

  return {
    name: "vite-fix-manifest",
    apply: "build",

    configResolved(_config) {
      config = _config;
    },

    async closeBundle() {
      try {
        const filePath = resolve(
          __dirname,
          config.build.outDir,
          "manifest.json",
        );

        const data = await readFile(filePath);
        const obj = JSON.parse(data.toString());
        obj[property] = object;

        await writeFile(filePath, JSON.stringify(obj));

        console.log("successfully fixed manifest");
      } catch (error) {
        console.error("Failed to fix manifest", error);
      }
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),

    !isWatch && [
      crx({
        manifest,
        contentScripts: {
          injectCss: true,
        },
      }),

      fixManifest({
        property: "web_accessible_resources",
        object: [
          {
            resources: ["assets/*.js", "*.png"],
            matches: ["<all_urls>"],
          },
        ],
      }),

      ViteMinifyPlugin(),
      ViteImageOptimizer(),
      zipPack({ outDir: "zip", outFileName: `${name}-${version}.zip` }),
    ],
  ],
  build: {
    minify: "esbuild",
    target: "esnext",
    emptyOutDir: true,
    rollupOptions,
  },
  esbuild: { legalComments: "none" },
});
