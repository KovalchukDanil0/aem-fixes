import { defineManifest } from "@crxjs/vite-plugin";
import { description, repository, version } from "./package.json";

export default defineManifest({
  manifest_version: 3,
  name: "AEMFixes",
  author: "Danil",
  offline_enabled: false,
  icons: {
    "16": "icon-16.png",
    "32": "icon-32.png",
    "48": "icon-48.png",
    "128": "icon-128.png",
  },
  action: {
    default_popup: "src/pages/popup/index.html",
  },
  background: {
    service_worker: "src/pages/background/index.ts",
  },
  minimum_chrome_version: "92",
  options_page: "src/pages/options/index.html",
  permissions: [
    "tabs",
    "storage",
    "contextMenus",
    "scripting",
    "webNavigation",
  ],
  host_permissions: ["<all_urls>"],
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
  homepage_url: repository.url,
  version,
  description,
});
