import { convertLink } from "$lib/convertLink";
import { onMessage, sendMessage } from "$lib/messaging";
import {
  fullAuthorPath,
  regexAuthor,
  regexHTMLExist,
  regexImagePicker,
} from "$lib/storage";

function toEnvironment(
  activeTabs: Browser.tabs.Tab[],
  env: EnvTypes,
  newTab: boolean,
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

const menus: Browser.contextMenus.CreateProperties[] = [
  { title: "Open content in DAM", contexts: ["image"], id: "openInDAM" },
  {
    title: "Open content in AEM tree",
    contexts: ["link", "selection"],
    id: "openInAEM",
  },
  {
    title: "Open content in TouchUI",
    contexts: ["selection"],
    id: "openInTouchUI",
  },
];

const menusWithParent: Browser.contextMenus.CreateProperties[] = [
  {
    title: "To Live",
    contexts: ["link"],
    id: "toLive",
  },
  {
    title: "To Perf",
    contexts: ["link"],
    id: "toPerf",
  },
  {
    title: "To Prod",
    contexts: ["link"],
    id: "toProd",
  },
  {
    title: "To Touch",
    contexts: ["link"],
    id: "toTouch",
  },
  {
    title: "To Classic",
    contexts: ["link"],
    id: "toClassic",
  },
];

type CommandEnvs = "toLive" | "toPerf" | "toProd" | "toAuthor";

export default defineBackground({
  type: "module",
  main() {
    onMessage("toEnvironment", ({ data: { tabs: msgTabs, env, newTab } }) => {
      toEnvironment(msgTabs, env, newTab);
    });

    onMessage("openInTree", ({ data: { tabs: msgTabs, url } }) => {
      const urlToOpen = url ?? msgTabs?.at(-1)?.url;
      openInTree(urlToOpen);
    });

    onMessage("getCookie", async ({ sender }) => {
      const senderTabUrl = sender.tab?.url;

      if (senderTabUrl) {
        const cookie = await browser.cookies.get({
          name: "ADFS-credential",
          url: senderTabUrl,
        });

        return cookie?.value;
      }
    });

    browser.runtime.onInstalled.addListener(() => {
      menus.forEach((menu) => browser.contextMenus.create(menu));

      const parentId = browser.contextMenus.create({
        title: "To Environment",
        contexts: ["link"],
        id: "toEnvironment",
      });

      menusWithParent.forEach(({ title, contexts, id }) =>
        browser.contextMenus.create({ title, contexts, id, parentId }),
      );
    });

    browser.contextMenus.onClicked.addListener(
      ({ menuItemId, srcUrl, selectionText, linkUrl }, patternTab) => {
        if (!patternTab) {
          throw new Error("tab in menus is undefined");
        }

        switch (menuItemId) {
          case "openInDAM": {
            const imagePath = srcUrl?.replace(regexImagePicker, "$1");

            changeContentInTab(imagePath, `https://${fullAuthorPath}/damadmin`);

            break;
          }
          case "openInAEM": {
            const newLinkUrl = selectionText
              ? `https://${fullAuthorPath}${selectionText}.html`
              : linkUrl;
            openInTree(newLinkUrl);

            break;
          }
          case "openInTouchUI": {
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

            break;
          }
          case "toLive":
            toEnvironment([patternTab], "live", true, linkUrl);
            break;
          case "toPerf":
            toEnvironment([patternTab], "perf", true, linkUrl);
            break;
          case "toProd":
            toEnvironment([patternTab], "prod", true, linkUrl);
            break;
          case "toTouch":
            toEnvironment([patternTab], "editor.html", true, linkUrl);
            break;
          case "toClassic":
            toEnvironment([patternTab], "cf#", true, linkUrl);
            break;
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
          toEnvironment([tab], "live", false);
          break;
        case "toPerf":
          toEnvironment([tab], "perf", false);
          break;
        case "toProd":
          toEnvironment([tab], "prod", false);
          break;
        case "toAuthor":
          toEnvironment([tab], "editor.html", false);
          break;
        default:
          throw new Error(`command was not found ${command}`);
      }
    });
  },
});
