import { crx } from "@crxjs/vite-plugin";
import react from "@vitejs/plugin-react-swc";
import { readFile, writeFile } from "fs/promises";
import { mdxToMd } from "mdx-to-md";
import { basename, join, resolve } from "path";
import { defineConfig, Plugin, ResolvedConfig } from "vite";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";
import zipPack from "vite-plugin-zip-pack";
import manifest from "./manifest.config";
import { name, version } from "./package.json";
import rollupOptions from "./rollup.config";

const isWatch = process.argv.includes("--watch");

function viteMdxToMdPlugin(): Plugin {
  return {
    name: "vite-plugin-mdx-to-md",
    apply: "build",

    async closeBundle() {
      try {
        const markdown = await mdxToMd(join(__dirname, "README.mdx"));

        const banner = "This README was auto-generated using 'npm run readme'";
        const readme = `<!--- ${banner} --> \n\n${markdown}`;
        await writeFile(basename(join(__dirname, "README.md")), readme);

        console.log("mdx was successfully transformed to md");
      } catch (error) {
        console.error("Failed to transform mdx", error);
      }
    },
  };
}

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
    !isWatch && [
      react(),

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

      ViteImageOptimizer(),
      zipPack({ outDir: "zip", outFileName: `${name}-${version}.zip` }),
      viteMdxToMdPlugin(),
    ],
  ],
  build: {
    minify: "esbuild",
    emptyOutDir: true,
    rollupOptions,
  },
  esbuild: { legalComments: "none" },
});
