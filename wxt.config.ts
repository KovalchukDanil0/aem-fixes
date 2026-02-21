import svelteSVG from "@hazycora/vite-plugin-svelte-svg";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";
import { defineConfig } from "wxt";

const email = "danilkovalchuk0@gmail.com";

export default defineConfig({
  vite: () => ({
    plugins: [
      svelteSVG({ requireSuffix: false, svgoConfig: {} }),
      ViteImageOptimizer(),
    ],
    optimizeDeps: {
      esbuildOptions: {
        target: "esnext",
      },
    },
    build: {
      target: "esnext",
      minify: true,
    },
    esbuild: {
      legalComments: "none",
      drop: ["console", "debugger"],
    },
    server: {
      hmr: false,
    },
  }),
  alias: {
    $lib: "src/lib",
    $assets: "src/assets",
  },
  srcDir: "src",
  outDir: "dist",
  modules: ["@wxt-dev/module-svelte"],
  manifestVersion: 3,
  manifest: {
    name: "AEMFixes",
    author: {
      email,
    },
    homepage_url: "https://github.com/kovalchukdanil0/aem-fixes.git",
    offline_enabled: false,
    permissions: ["tabs", "storage", "contextMenus", "cookies", "scripting"],
    host_permissions: ["<all_urls>"],
    icons: {
      "16": "icon/16.png",
      "32": "icon/32.png",
      "64": "icon/64.png",
      "128": "icon/128.png",
    },
    browser_specific_settings: {
      gecko: {
        id: email,
      },
    },
    commands: {
      toLive: {
        suggested_key: { default: "Alt+Z" },
        description: "Moving page to live",
      },
      toPerf: {
        suggested_key: { default: "Alt+X" },
        description: "Moving page to perf",
      },
      toProd: {
        suggested_key: { default: "Alt+C" },
        description: "Moving page to prod",
      },
      toAuthor: {
        suggested_key: { default: "Alt+V" },
        description: "Moving page to author",
      },
    },
  },
});
