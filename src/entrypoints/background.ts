import livePerfUrl from "$assets/livePerf.scss?url";
import { convertLink } from "$lib/convertLink";
import { onMessage, sendMessage } from "$lib/messaging";
import { initPosthog } from "$lib/posthog";
import {
  fullAuthorPath,
  regexAuthor,
  regexHTMLExist,
  regexImagePicker,
} from "$lib/storage";
import { determinePageTag } from "$lib/tags";
import { noCase, snakeCase } from "change-case";
import type { PostHog } from "posthog-js/dist/module.no-external";

let posthog: PostHog | null = null;

function toEnvironment(
  activeTabs: Browser.tabs.Tab[],
  newTab: boolean,
  env: EnvTypes,
  url?: string,
) {
  activeTabs.forEach(async ({ url: tabUrl, index, id }) => {
    tabUrl = url ?? tabUrl;
    if (!tabUrl) {
      throw new Error("url is undefined");
    }

    const newUrl = await convertLink(env, new URL(tabUrl)).catch(
      async (error: Error) => {
        await sendMessage("showMessage", {
          color: "error",
          text: `ERROR - ${error.message}`,
        });

        throw new Error(error.message);
      },
    );

    if (!newTab && id) {
      browser.tabs.update(id, {
        url: newUrl,
      });
    } else {
      browser.tabs.create({ index: index + 1, url: newUrl });
    }
  });
}

const changeContentInTab = async function (
  content: string | undefined,
  urlPattern: string,
) {
  if (!content) {
    throw new Error("Tab content is undefined");
  }

  const patternTabs = await browser.tabs.query({
    currentWindow: true,
    url: urlPattern,
  });

  const url = `${urlPattern}#${content}`;
  if (patternTabs.length !== 0) {
    const tab = patternTabs[0];

    if (!tab.id) {
      return;
    }

    browser.tabs.update(tab.id, {
      highlighted: true,
      url,
    });
  } else {
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    browser.tabs.create({ index: tab.index + 1, url });
  }
};

const openInTree = function (authorUrl?: string) {
  authorUrl = authorUrl?.replace(regexAuthor, "$3");
  changeContentInTab(authorUrl, `https://${fullAuthorPath}/siteadmin`);
};

const menus: Record<
  string,
  Omit<Browser.contextMenus.CreateProperties, "id">
> = {
  openInDAM: { title: "Open content in DAM", contexts: ["image"] },
  openInAEM: {
    title: "Open content in AEM tree",
    contexts: ["link", "selection"],
  },
  openInTouchUI: {
    title: "Open content in TouchUI",
    contexts: ["selection"],
  },
  checkTag: {
    title: "Check Tag",
    contexts: ["link"],
  },
};

const menusWithParent: Record<
  string,
  Omit<Browser.contextMenus.CreateProperties, "id">
> = {
  toLive: {
    title: "To Live",
    contexts: ["link"],
  },
  toPerf: {
    title: "To Perf",
    contexts: ["link"],
  },
  toProd: {
    title: "To Prod",
    contexts: ["link"],
  },
  toTouch: {
    title: "To Touch",
    contexts: ["link"],
  },
  toClassic: {
    title: "To Classic",
    contexts: ["link"],
  },
};

type CommandEnvs = "toLive" | "toPerf" | "toProd" | "toAuthor";

function handleOpenInDAM(srcUrl: string | undefined) {
  const imagePath = srcUrl?.replace(regexImagePicker, "$1");
  changeContentInTab(imagePath, `https://${fullAuthorPath}/damadmin`);
}

function handleOpenInAEM(
  selectionText: string | undefined,
  linkUrl: string | undefined,
) {
  const newLinkUrl = selectionText
    ? `https://${fullAuthorPath}${selectionText}.html`
    : linkUrl;
  openInTree(newLinkUrl);
}

function handleOpenInTouchUI(
  selectionText: string | undefined,
  patternTab: Browser.tabs.Tab,
) {
  let content: string | undefined = selectionText;
  if (!content) {
    throw new Error("openInTouchUI content is undefined");
  }

  if (!regexHTMLExist.test(content)) {
    content += ".html";
  }

  const newUrl = `https://${fullAuthorPath}/editor.html${content}`;
  browser.tabs.create({
    url: newUrl,
    index: patternTab.index + 1,
  });
}

function handleToEnvironment(
  patternTab: Browser.tabs.Tab,
  linkUrl: string | undefined,
  env: EnvTypes,
) {
  toEnvironment([patternTab], true, env, linkUrl);
}

export default defineBackground({
  type: "module",
  main() {
    onMessage("toEnvironment", ({ data: { tabs: msgTabs, env, newTab } }) => {
      if (!env) {
        return;
      }

      toEnvironment(msgTabs, newTab, env);
    });

    onMessage("openInTree", ({ data: { tabs: msgTabs, url } }) => {
      const urlToOpen = url ?? msgTabs?.at(-1)?.url;
      openInTree(urlToOpen);
    });

    onMessage("getCookie", async ({ sender }) => {
      const senderTabUrl = sender.tab.url;
      if (!senderTabUrl) {
        return;
      }

      const cookie = await browser.cookies.get({
        name: "ADFS-credential",
        url: senderTabUrl,
      });
      return cookie?.value;
    });

    onMessage("injectMothersiteCss", async ({ sender }) => {
      const tabId = sender.tab.id;
      if (!tabId) {
        return;
      }

      browser.scripting.insertCSS({
        target: { tabId: sender.tab.id },
        files: [livePerfUrl],
      });
    });

    browser.runtime.onInstalled.addListener(() => {
      Object.entries(menus).forEach(([id, props]) =>
        browser.contextMenus.create({ id, ...props }),
      );

      const parentId = browser.contextMenus.create({
        title: "To Environment",
        contexts: ["link"],
        id: "toEnvironment",
      });

      Object.entries(menusWithParent).forEach(([id, { title, contexts }]) =>
        browser.contextMenus.create({ parentId, id, title, contexts }),
      );
    });

    browser.contextMenus.onClicked.addListener(
      async ({ menuItemId, srcUrl, selectionText, linkUrl }, patternTab) => {
        if (!patternTab) {
          throw new Error("tab in menus is undefined");
        }

        posthog ??= await initPosthog({
          persistence: "localStorage",
          capture_pageview: false,
          autocapture: false,
          disable_session_recording: true,
          disable_surveys: true,
        });

        posthog.capture(`menu_${snakeCase(noCase(menuItemId.toString()))}`);

        switch (menuItemId) {
          case "openInDAM":
            handleOpenInDAM(srcUrl);
            break;
          case "openInAEM":
            handleOpenInAEM(selectionText, linkUrl);
            break;
          case "openInTouchUI":
            handleOpenInTouchUI(selectionText, patternTab);
            break;
          case "toLive":
            handleToEnvironment(patternTab, linkUrl, "live");
            break;
          case "toPerf":
            handleToEnvironment(patternTab, linkUrl, "perf");
            break;
          case "toProd":
            handleToEnvironment(patternTab, linkUrl, "prod");
            break;
          case "toTouch":
            handleToEnvironment(patternTab, linkUrl, "editor.html");
            break;
          case "toClassic":
            handleToEnvironment(patternTab, linkUrl, "cf#");
            break;
          case "checkTag": {
            const pageTag = await determinePageTag(linkUrl);
            if (!pageTag) {
              return;
            }

            sendMessage(
              "getUrlPageTag",
              {
                pageTag,
              },
              patternTab.id,
            );
            break;
          }
          default:
            break;
        }
      },
    );

    browser.commands.onCommand.addListener((command: string, tab) => {
      if (!tab) {
        return;
      }

      switch (command as CommandEnvs) {
        case "toLive":
          toEnvironment([tab], false, "live");
          break;
        case "toPerf":
          toEnvironment([tab], false, "perf");
          break;
        case "toProd":
          toEnvironment([tab], false, "prod");
          break;
        case "toAuthor":
          toEnvironment([tab], false, "editor.html");
          break;
        default:
          throw new Error(`command was not found ${command}`);
      }
    });
  },
});
