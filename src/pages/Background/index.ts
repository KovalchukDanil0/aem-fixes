import Browser, { Menus, Tabs, WebNavigation } from "webextension-polyfill";
import AEMLink, {
  MessageAlert,
  MessageEnv,
  classic,
  getCurrentTab,
  getFullAuthorPath,
  getLocalSavedData,
  getWorkflowPath,
  ifAuthorNoEnv,
  ifJira,
  ifLive,
  ifPerfProd,
  regexAuthor,
  regexWorkflow,
  touch,
} from "../../shared";

async function regexImagePicker(): Promise<RegExp> {
  const data = await getLocalSavedData();
  return new RegExp(data.secretSettings.regexImagePicker);
}

async function regexHTMLExist(): Promise<RegExp> {
  const data = await getLocalSavedData();
  return new RegExp(data.secretSettings.regexHTMLExist);
}

async function findReplaceUrl(): Promise<string> {
  const data = await getLocalSavedData();
  return data.secretSettings.findReplaceUrl;
}

async function damTreeUrl(): Promise<string> {
  const data = await getLocalSavedData();
  return data.secretSettings.DAMTreeUrl;
}

const ifLivePerf = async (url: string): Promise<boolean> =>
  (await ifPerfProd(url)) || ifLive(url);

const ifAEMToolsUrl = async (url: string) =>
  url.includes(await getWorkflowPath());

const ifDamUrl = async (url: string) => url.includes(await damTreeUrl());

const ifFindReplaceUrl = async (url: string) =>
  url.includes(await findReplaceUrl());

const ifWorkflowUrl = async (url: string) => (await regexWorkflow()).test(url);

async function findAsyncSequential<T>(
  array: T[],
  predicate: (t: T) => Promise<boolean>,
): Promise<T | undefined> {
  for (const t of array) {
    if (await predicate(t)) {
      return t;
    }
  }
  return undefined;
}

function toEnvironment(
  tabs: Tabs.Tab[],
  newTab: boolean,
  env: string,
  url?: string,
) {
  tabs.forEach(async (tab) => {
    const initUrl: string | undefined = url ?? tab.url;

    let data: AEMLink | undefined;
    try {
      data = new AEMLink(initUrl);
      await data?.initialize();
    } catch (error) {
      const message: MessageAlert = {
        from: "background",
        subject: "showMessage",
        color: "error",
        message: `ERROR - ${(error as Error).message}`,
      };

      Browser.runtime.sendMessage(message);

      return;
    }

    const newUrl = await data?.determineEnv(env);

    if (newTab) {
      Browser.tabs.create({ index: tab.index + 1, url: newUrl });
    } else {
      Browser.tabs.update(tab.id, {
        url: newUrl,
      });
    }
  });

  Browser.runtime.sendMessage({
    from: "background",
    subject: "showMessage",
    message: "SUCCESS",
    color: "success",
  } as MessageAlert);
}

const changeContentInTab = async function (
  content: string | undefined,
  urlPattern: string,
) {
  if (!content) {
    throw new Error("Tab content is undefined");
  }

  const tabs: Tabs.Tab[] = await Browser.tabs.query({
    currentWindow: true,
    url: urlPattern,
  });

  let tab: Tabs.Tab;
  const newUrl = `${urlPattern}#${content}`;
  if (tabs.length !== 0) {
    tab = tabs[0];

    Browser.tabs.highlight({ tabs: tab.index });
    Browser.tabs.update(tab.id, {
      url: newUrl,
    });
  } else {
    tab = await getCurrentTab();
    Browser.tabs.create({ url: newUrl, index: tab.index + 1 });
  }
};

const openInTree = async function (authorUrl: string | undefined) {
  authorUrl = authorUrl?.replace(await regexAuthor(), "$3");

  const fullAuthorPath = await getFullAuthorPath();

  changeContentInTab(authorUrl, `https://${fullAuthorPath}/siteadmin`);
};

Browser.runtime.onMessage.addListener(
  (msg: MessageEnv, _sender, _sendResponse) => {
    if (msg.from !== "background") {
      if (msg.subject === "toEnvironment") {
        toEnvironment(msg.tabs, msg.newTab, msg.env);
      }

      if (msg.subject === "openInTree") {
        const url = msg.url ?? msg.tabs?.[msg.tabs?.length - 1].url;
        openInTree(url);
      }
    }
  },
);

Browser.runtime.onInstalled.addListener(function () {
  Browser.contextMenus.create({
    title: "Open content in DAM",
    contexts: ["image"],
    id: "openInDAM",
  });

  Browser.contextMenus.create({
    title: "Open content in AEM tree",
    contexts: ["link", "selection"],
    id: "openInAEM",
  });

  Browser.contextMenus.create({
    title: "Open content in TouchUI",
    contexts: ["selection"],
    id: "openInTouchUI",
  });

  const parent = Browser.contextMenus.create({
    title: "To Environment",
    contexts: ["link"],
    id: "toEnvironment",
  });

  Browser.contextMenus.create({
    title: "To Live",
    contexts: ["link"],
    parentId: parent,
    id: "toLive",
  });

  Browser.contextMenus.create({
    title: "To Perf",
    contexts: ["link"],
    parentId: parent,
    id: "toPerf",
  });

  Browser.contextMenus.create({
    title: "To Prod",
    contexts: ["link"],
    parentId: parent,
    id: "toProd",
  });

  Browser.contextMenus.create({
    title: "To Touch",
    contexts: ["link"],
    parentId: parent,
    id: "toTouch",
  });

  Browser.contextMenus.create({
    title: "To Classic",
    contexts: ["link"],
    parentId: parent,
    id: "toClassic",
  });
});

async function menusOnClick(
  info: Menus.OnClickData,
  tabs: Tabs.Tab | undefined,
) {
  if (!tabs) {
    throw new Error("tabs in menus are undefined");
  }

  const fullAuthorPath = await getFullAuthorPath();

  const tab: Tabs.Tab[] = [tabs];
  switch (info.menuItemId) {
    case "openInDAM": {
      const imagePath: string | undefined = info.srcUrl?.replace(
        await regexImagePicker(),
        "$1",
      );

      changeContentInTab(imagePath, `https://${fullAuthorPath}/damadmin`);

      break;
    }
    case "openInAEM": {
      let linkUrl: string | undefined;
      if (info.selectionText) {
        linkUrl = `https://${fullAuthorPath}${info.selectionText}.html`;
      } else {
        linkUrl = info.linkUrl;
      }

      openInTree(linkUrl);

      break;
    }
    case "openInTouchUI": {
      let content: string | undefined = info.selectionText;
      if (!content) {
        throw new Error("openInTouchUI content is undefined");
      }

      if (!(await regexHTMLExist()).test(content)) {
        content += ".html";
      }

      const newUrl = `https://${fullAuthorPath}/editor.html${content}`;
      Browser.tabs.create({
        url: newUrl,
        index: tab[tab.length - 1].index + 1,
      });

      break;
    }
    case "toLive":
      toEnvironment(tab, true, "live", info.linkUrl);
      break;
    case "toPerf":
      toEnvironment(tab, true, "perf", info.linkUrl);
      break;
    case "toProd":
      toEnvironment(tab, true, "prod", info.linkUrl);
      break;
    case "toTouch":
      toEnvironment(tab, true, touch, info.linkUrl);
      break;
    case "toClassic":
      toEnvironment(tab, true, classic, info.linkUrl);
      break;
    default:
      break;
  }
}

Browser.contextMenus.onClicked.addListener(menusOnClick);

type ResultType = [injectScript: string, allFrames?: boolean];
type ConditionType = {
  isTrue: (url: string) => Promise<boolean>;
  result: () => ResultType;
};

const conditions: ConditionType[] = [
  {
    isTrue: (url: string) => ifLivePerf(url),
    result: () => ["livePerf.bundle.js", false],
  },
  {
    isTrue: (url: string) => ifAuthorNoEnv(url),
    result: () => ["author.bundle.js"],
  },
  {
    isTrue: (url: string) => ifAEMToolsUrl(url),
    result: () => ["createWFAEMTools.bundle.js"],
  },
  {
    isTrue: (url: string) => ifDamUrl(url),
    result: () => ["damAdmin.bundle.js"],
  },
  {
    isTrue: (url: string) => ifFindReplaceUrl(url),
    result: () => ["findReplace.bundle.js"],
  },
  {
    isTrue: (url: string) => ifJira(url),
    result: () => ["jira.bundle.js"],
  },
  {
    isTrue: (url: string) => ifWorkflowUrl(url),
    result: () => ["WFPage.bundle.js"],
  },
];

async function onLoadingComplete(
  details: WebNavigation.OnCompletedDetailsType,
) {
  console.log(details.url);

  if (!details.url) {
    return;
  }

  const tabId = details.tabId;
  if (!tabId) {
    return;
  }

  const conditionFound: ConditionType | undefined = await findAsyncSequential(
    conditions,
    ({ isTrue }) => isTrue(details.url),
  );
  if (!conditionFound) {
    return;
  }

  console.log(conditionFound);

  const [injectScript, allFrames]: ResultType = conditionFound.result();

  Browser.scripting.executeScript({
    target: { tabId, allFrames: allFrames ?? true },
    files: [injectScript],
  });
}

Browser.webNavigation.onCompleted.addListener(onLoadingComplete);
