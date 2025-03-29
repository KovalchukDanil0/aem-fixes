import axios from "axios";
import { convertLink } from "src/lib/convertLink";
import {
  getFullAuthorPath,
  getLocalSavedData,
  getRegexAuthor,
  getRegexWorkflow,
  getWorkflowPath,
  ifAuthorNoEnv,
  ifJira,
  ifLive,
  ifPerfProd,
} from "src/lib/storage";
import { findAsyncSequential, getCurrentTab } from "src/lib/tools";
import { EnvTypesExtended, MessageAlert, MessageEnv } from "src/lib/types";
import {
  Menus,
  Tabs,
  WebNavigation,
  commands,
  contextMenus,
  cookies,
  runtime,
  scripting,
  tabs,
  webNavigation,
} from "webextension-polyfill";

async function getRegexImagePicker(): Promise<RegExp> {
  const {
    secretSettings: { regexImagePicker },
  } = await getLocalSavedData();
  return new RegExp(regexImagePicker);
}

async function getRegexHTMLExist(): Promise<RegExp> {
  const {
    secretSettings: { regexHTMLExist },
  } = await getLocalSavedData();
  return new RegExp(regexHTMLExist);
}

async function getFindReplaceUrl(): Promise<string> {
  const {
    secretSettings: { findReplaceUrl },
  } = await getLocalSavedData();
  return findReplaceUrl;
}

async function getDamTreeUrl(): Promise<string> {
  const {
    secretSettings: { DAMTreeUrl },
  } = await getLocalSavedData();
  return DAMTreeUrl;
}

const ifLivePerf = async (url: string): Promise<boolean> =>
  (await ifPerfProd(url)) || ifLive(url);

async function ifAEMToolsUrl(url: string): Promise<boolean> {
  const workflowPath = await getWorkflowPath();
  return url.includes(workflowPath);
}

async function ifDamUrl(url: string): Promise<boolean> {
  const DAMTreeUrl = await getDamTreeUrl();
  return url.includes(DAMTreeUrl);
}

async function ifFindReplaceUrl(url: string): Promise<boolean> {
  const findReplaceUrl = await getFindReplaceUrl();
  return url.includes(findReplaceUrl);
}

async function ifWorkflowUrl(url: string): Promise<boolean> {
  const regexWorkflow = await getRegexWorkflow();
  return regexWorkflow.test(url);
}

function toEnvironment(
  activeTabs: Tabs.Tab[],
  newTab: boolean,
  env: EnvTypesExtended,
  url?: string,
): void {
  activeTabs.forEach(async ({ url: tabUrl, index, id }) => {
    tabUrl = url ?? tabUrl;
    if (!tabUrl) {
      throw new Error("url is undefined");
    }

    let newUrl: string;

    try {
      newUrl = await convertLink(env, new URL(tabUrl));
    } catch (error) {
      const errorMessage = (error as Error).message;

      const message: MessageAlert = {
        from: "background",
        subject: "showMessage",
        color: "error",
        message: `ERROR - ${errorMessage}`,
      };
      runtime.sendMessage(message);

      throw new Error(errorMessage);
    }

    if (newTab) {
      tabs.create({ index: index + 1, url: newUrl });
    } else {
      tabs.update(id, {
        url: newUrl,
      });
    }
  });

  runtime.sendMessage({
    from: "background",
    subject: "showMessage",
    message: "SUCCESS",
    color: "success",
  } as MessageAlert);
}

const changeContentInTab = async function (
  content: string | undefined,
  urlPattern: string,
): Promise<void> {
  if (!content) {
    throw new Error("Tab content is undefined");
  }

  const patternTabs: Tabs.Tab[] = await tabs.query({
    currentWindow: true,
    url: urlPattern,
  });

  let tab: Tabs.Tab;
  const newUrl = `${urlPattern}#${content}`;
  if (patternTabs.length !== 0) {
    tab = patternTabs[0];

    tabs.highlight({ tabs: tab.index });
    tabs.update(tab.id, {
      url: newUrl,
    });
  } else {
    tab = await getCurrentTab();
    tabs.create({ url: newUrl, index: tab.index + 1 });
  }
};

const openInTree = async function (authorUrl?: string): Promise<void> {
  const regexAuthor = await getRegexAuthor();
  authorUrl = authorUrl?.replace(regexAuthor, "$3");

  const fullAuthorPath = await getFullAuthorPath();
  changeContentInTab(authorUrl, `https://${fullAuthorPath}/siteadmin`);
};

runtime.onMessage.addListener(
  // @ts-expect-error types issue
  async (
    { from, subject, env, newTab, tabs: msgTabs, url }: MessageEnv,
    sender,
  ): Promise<string | undefined> => {
    if (from === "background") {
      return;
    }

    switch (subject) {
      case "toEnvironment":
        toEnvironment(msgTabs, newTab, env);
        break;

      case "openInTree": {
        const urlToOpen = url ?? msgTabs[msgTabs.length - 1].url;
        openInTree(urlToOpen);

        break;
      }

      case "getCookie":
        if (sender.tab?.url) {
          const cookie = await cookies.get({
            name: "ADFS-credential",
            url: sender.tab?.url,
          });

          return Promise.resolve(cookie?.value);
        }

        break;

      default:
        break;
    }
  },
);

const menus: Menus.CreateCreatePropertiesType[] = [
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

const menusWithParent: Menus.CreateCreatePropertiesType[] = [
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

runtime.onInstalled.addListener((): void => {
  menus.forEach((menu) => contextMenus.create(menu));

  const parentId = contextMenus.create({
    title: "To Environment",
    contexts: ["link"],
    id: "toEnvironment",
  });

  menusWithParent.forEach(({ title, contexts, id }) =>
    contextMenus.create({ title, contexts, id, parentId }),
  );
});

contextMenus.onClicked.addListener(
  async (
    { menuItemId, srcUrl, selectionText, linkUrl },
    patternTab,
  ): Promise<void> => {
    if (!patternTab) {
      throw new Error("tab in menus is undefined");
    }

    const fullAuthorPath = await getFullAuthorPath();

    switch (menuItemId) {
      case "openInDAM": {
        const regexImagePicker = await getRegexImagePicker();
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

        const regexHTMLExist = await getRegexHTMLExist();
        if (!regexHTMLExist.test(content)) {
          content += ".html";
        }

        const newUrl = `https://${fullAuthorPath}/editor.html${content}`;
        tabs.create({
          url: newUrl,
          index: patternTab.index + 1,
        });

        break;
      }
      case "toLive":
        toEnvironment([patternTab], true, "live", linkUrl);
        break;
      case "toPerf":
        toEnvironment([patternTab], true, "perf", linkUrl);
        break;
      case "toProd":
        toEnvironment([patternTab], true, "prod", linkUrl);
        break;
      case "toTouch":
        toEnvironment([patternTab], true, "editor.html", linkUrl);
        break;
      case "toClassic":
        toEnvironment([patternTab], true, "cf#", linkUrl);
        break;
      default:
        break;
    }
  },
);

type CommandEnvs = "toLive" | "toPerf" | "toProd" | "toAuthor";

commands.onCommand.addListener((command, tab): void => {
  const typedCommand = command as CommandEnvs;

  if (!tab) {
    return;
  }

  switch (typedCommand) {
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
      throw new Error(`command was not found ${typedCommand}`);
  }
});

type ResultType = [injectScript: string, allFrames?: boolean];
interface ConditionType {
  isTrue: (url: string) => Promise<boolean>;
  result: () => ResultType;
}

const conditions: ConditionType[] = [
  {
    isTrue: (url: string) => ifLivePerf(url),
    result: () => ["assets/livePerf"],
  },
  {
    isTrue: (url: string) => ifAuthorNoEnv(url),
    result: () => ["assets/author"],
  },
  {
    isTrue: (url: string) => ifAEMToolsUrl(url),
    result: () => ["assets/createWFAemTools"],
  },
  {
    isTrue: (url: string) => ifDamUrl(url),
    result: () => ["assets/damAdmin"],
  },
  {
    isTrue: (url: string) => ifFindReplaceUrl(url),
    result: () => ["assets/findReplace"],
  },
  {
    isTrue: (url: string) => ifJira(url),
    result: () => ["assets/jira"],
  },
  {
    isTrue: (url: string) => ifWorkflowUrl(url),
    result: () => ["assets/wfPage"],
  },
];

async function resolveModule(scriptPath: string): Promise<void> {
  try {
    const script = await import(scriptPath);
    script();
  } catch (err) {
    console.error(err);
  }
}

webNavigation.onCompleted.addListener(onLoadingComplete);
async function onLoadingComplete({
  url,
  tabId,
  frameId,
}: WebNavigation.OnCompletedDetailsType): Promise<void> {
  if (!url || !tabId) {
    return;
  }

  const conditionFound: ConditionType | undefined = await findAsyncSequential(
    conditions,
    ({ isTrue }) => isTrue(url),
  );
  if (!conditionFound) {
    return;
  }

  const [injectScript, allFrames]: ResultType = conditionFound.result();
  const scriptPath = runtime.getURL(injectScript);

  const target = {
    tabId,
    frameIds: [frameId],
    allFrames: allFrames ?? false,
  };

  scripting.executeScript({
    target,
    func: resolveModule,
    args: [`${scriptPath}.js`],
  });

  const cssResource = `${injectScript}.css`;
  const { status } = await axios.request({ url: cssResource }).catch(() => {
    return { status: null };
  });

  if (status === 200) {
    scripting.insertCSS({
      target,
      files: [cssResource],
    });
  }
}
