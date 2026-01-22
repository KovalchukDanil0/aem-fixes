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

async function toEnvironment(
  activeTabs: Browser.tabs.Tab[],
  newTab: boolean,
  env: EnvTypes,
  url?: string,
) {
  for (const activeTab of activeTabs) {
    const tabUrl = url ?? activeTab.url;
    if (!tabUrl) {
      throw new Error("url is undefined");
    }

    const newUrl = await convertLink(env, new URL(tabUrl)).catch(
      async (error: unknown) => {
        if (error instanceof Error) {
          await sendMessage("showMessage", {
            color: "error",
            text: `ERROR - ${error.message}`,
          });

          throw new Error(error.message);
        }
      },
    );

    if (!newTab && activeTab.id) {
      browser.tabs.update(activeTab.id, {
        url: newUrl,
      });
    } else {
      browser.tabs.create({ index: activeTab.index + 1, url: newUrl });
    }
  }
}

const changeContentInTab = async function (
  urlPattern: string,
  content?: string,
) {
  if (!content) {
    throw new Error("Tab content is undefined");
  }

  const patternTabs = await browser.tabs.query({
    currentWindow: true,
    url: urlPattern,
  });

  const url = `${urlPattern}#${content}`;
  if (patternTabs.length) {
    const tab = patternTabs[0];

    if (!tab) {
      return;
    }

    await browser.tabs.update(tab.id, {
      highlighted: true,
      url,
    });
  } else {
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab?.index) {
      return;
    }
    await browser.tabs.create({ index: tab.index + 1, url });
  }
};

const openInTree = async function (authorUrl?: string) {
  authorUrl = authorUrl?.replace(regexAuthor, "$3");
  await changeContentInTab(`https://${fullAuthorPath}/siteadmin`, authorUrl);
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

async function handleOpenInDAM(srcUrl?: string) {
  const imagePath = srcUrl?.replace(regexImagePicker, "$1");
  await changeContentInTab(`https://${fullAuthorPath}/damadmin`, imagePath);
}

async function handleOpenInAEM(selectionText?: string, linkUrl?: string) {
  const newLinkUrl = selectionText
    ? `https://${fullAuthorPath}${selectionText}.html`
    : linkUrl;
  await openInTree(newLinkUrl);
}

async function handleOpenInTouchUI(
  patternTab: Browser.tabs.Tab,
  selectionText?: string,
) {
  let content = selectionText;
  if (!content) {
    throw new Error("openInTouchUI content is undefined");
  }

  if (!regexHTMLExist.test(content)) {
    content += ".html";
  }

  const newUrl = `https://${fullAuthorPath}/editor.html${content}`;
  await browser.tabs.create({
    url: newUrl,
    index: patternTab.index + 1,
  });
}

async function handleToEnvironment(
  patternTab: Browser.tabs.Tab,
  env: EnvTypes,
  linkUrl?: string,
) {
  await toEnvironment([patternTab], true, env, linkUrl);
}

async function checkTag(url?: string, tabId?: number) {
  if (!url || !tabId) {
    return;
  }

  const pageTag = await determinePageTag(url);
  if (!pageTag) {
    return;
  }

  await sendMessage(
    "getUrlPageTag",
    {
      pageTag,
    },
    tabId,
  );
}

export default defineBackground({
  type: "module",
  main() {
    onMessage(
      "toEnvironment",
      async ({ data: { tabs: msgTabs, env, newTab } }) => {
        if (!env) {
          return;
        }

        await toEnvironment(msgTabs, newTab, env);
      },
    );

    onMessage("openInTree", async ({ data: { tabs: msgTabs, url } }) => {
      const urlToOpen = url ?? msgTabs?.at(-1)?.url;
      await openInTree(urlToOpen);
    });

    onMessage("getCookie", async ({ sender }) => {
      const senderTabUrl: string | undefined = sender.tab.url;
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
      const tabId: number | undefined = sender.tab.id;
      if (!tabId) {
        return;
      }

      await browser.scripting.insertCSS({
        target: { tabId },
        files: [livePerfUrl],
      });
    });

    browser.runtime.onInstalled.addListener(() => {
      for (const [id, props] of Object.entries(menus)) {
        browser.contextMenus.create({ id, ...props });
      }

      const parentId = browser.contextMenus.create({
        title: "To Environment",
        contexts: ["link"],
        id: "toEnvironment",
      });

      for (const [id, { title, contexts }] of Object.entries(menusWithParent)) {
        browser.contextMenus.create({ parentId, id, title, contexts });
      }
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
            await handleOpenInDAM(srcUrl);
            break;
          case "openInAEM":
            await handleOpenInAEM(selectionText, linkUrl);
            break;
          case "openInTouchUI":
            await handleOpenInTouchUI(patternTab, selectionText);
            break;
          case "toLive":
            await handleToEnvironment(patternTab, "live", linkUrl);
            break;
          case "toPerf":
            await handleToEnvironment(patternTab, "perf", linkUrl);
            break;
          case "toProd":
            await handleToEnvironment(patternTab, "prod", linkUrl);
            break;
          case "toTouch":
            await handleToEnvironment(patternTab, "editor.html", linkUrl);
            break;
          case "toClassic":
            await handleToEnvironment(patternTab, "cf#", linkUrl);
            break;
          case "checkTag":
            await checkTag(linkUrl, patternTab.id);
            break;
          default:
            break;
        }
      },
    );

    browser.commands.onCommand.addListener(async (command: string, tab) => {
      if (!tab) {
        return;
      }

      switch (command as CommandEnvs) {
        case "toLive":
          await toEnvironment([tab], false, "live");
          break;
        case "toPerf":
          await toEnvironment([tab], false, "perf");
          break;
        case "toProd":
          await toEnvironment([tab], false, "prod");
          break;
        case "toAuthor":
          await toEnvironment([tab], false, "editor.html");
          break;
        default:
          throw new Error(`command was not found ${command}`);
      }
    });
  },
});
