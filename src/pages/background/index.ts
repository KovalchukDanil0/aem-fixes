import axios from "axios";
import {
  Menus,
  Tabs,
  WebNavigation,
  commands,
  contextMenus,
  runtime,
  scripting,
  tabs,
  webNavigation,
} from "webextension-polyfill";
import AEMLink, {
  EnvTypesExtended,
  MessageAlert,
  MessageEnv,
  classic,
  findAsyncSequential,
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

const ifAEMToolsUrl = async (url: string) =>
  url.includes(await getWorkflowPath());

const ifDamUrl = async (url: string) => url.includes(await getDamTreeUrl());

const ifFindReplaceUrl = async (url: string) =>
  url.includes(await getFindReplaceUrl());

const ifWorkflowUrl = async (url: string) => (await regexWorkflow()).test(url);

function aemLinkError({ message: errorMessage }: Error) {
  const message: MessageAlert = {
    from: "background",
    subject: "showMessage",
    color: "error",
    message: `ERROR - ${errorMessage}`,
  };

  runtime.sendMessage(message);
}

function toEnvironment(
  activeTabs: Tabs.Tab[],
  newTab: boolean,
  env: EnvTypesExtended,
  url?: string,
) {
  activeTabs.forEach(async ({ url: tabUrl, index, id }) => {
    const initUrl: string | undefined = url ?? tabUrl;

    const data = new AEMLink(initUrl);
    await data.initialize();

    const newUrl = await data.determineEnv(env).catch(aemLinkError);

    if (!newUrl) {
      throw new Error("newUrl is undefined");
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
) {
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

const openInTree = async function (authorUrl?: string) {
  authorUrl = authorUrl?.replace(await regexAuthor(), "$3");

  const fullAuthorPath = await getFullAuthorPath();
  changeContentInTab(authorUrl, `https://${fullAuthorPath}/siteadmin`);
};

runtime.onMessage.addListener(
  (
    { from, subject, env, newTab, tabs: msgTabs, url: msgUrl }: MessageEnv,
    _sender,
    _sendResponse,
  ) => {
    if (from !== "background") {
      if (subject === "toEnvironment") {
        toEnvironment(msgTabs, newTab, env);
      }

      if (subject === "openInTree") {
        const url = msgUrl ?? msgTabs?.[msgTabs?.length - 1].url;
        openInTree(url);
      }
    }
  },
);

runtime.onInstalled.addListener(function () {
  contextMenus.create({
    title: "Open content in DAM",
    contexts: ["image"],
    id: "openInDAM",
  });

  contextMenus.create({
    title: "Open content in AEM tree",
    contexts: ["link", "selection"],
    id: "openInAEM",
  });

  contextMenus.create({
    title: "Open content in TouchUI",
    contexts: ["selection"],
    id: "openInTouchUI",
  });

  const parentId = contextMenus.create({
    title: "To Environment",
    contexts: ["link"],
    id: "toEnvironment",
  });

  contextMenus.create({
    title: "To Live",
    contexts: ["link"],
    id: "toLive",
    parentId,
  });

  contextMenus.create({
    title: "To Perf",
    contexts: ["link"],
    id: "toPerf",
    parentId,
  });

  contextMenus.create({
    title: "To Prod",
    contexts: ["link"],
    id: "toProd",
    parentId,
  });

  contextMenus.create({
    title: "To Touch",
    contexts: ["link"],
    id: "toTouch",
    parentId,
  });

  contextMenus.create({
    title: "To Classic",
    contexts: ["link"],
    id: "toClassic",
    parentId,
  });
});

contextMenus.onClicked.addListener(menusOnClick);
async function menusOnClick(
  { menuItemId, srcUrl, selectionText, linkUrl }: Menus.OnClickData,
  patternTabs: Tabs.Tab | undefined,
) {
  if (!patternTabs) {
    throw new Error("tabs in menus are undefined");
  }

  const fullAuthorPath = await getFullAuthorPath();

  const tab: Tabs.Tab[] = [patternTabs];
  switch (menuItemId) {
    case "openInDAM": {
      const imagePath: string | undefined = srcUrl?.replace(
        await getRegexImagePicker(),
        "$1",
      );

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

      const regexHTMLExistCached = await getRegexHTMLExist();
      if (!regexHTMLExistCached.test(content)) {
        content += ".html";
      }

      const newUrl = `https://${fullAuthorPath}/editor.html${content}`;
      tabs.create({
        url: newUrl,
        index: tab[tab.length - 1].index + 1,
      });

      break;
    }
    case "toLive":
      toEnvironment(tab, true, "live", linkUrl);
      break;
    case "toPerf":
      toEnvironment(tab, true, "perf", linkUrl);
      break;
    case "toProd":
      toEnvironment(tab, true, "prod", linkUrl);
      break;
    case "toTouch":
      toEnvironment(tab, true, touch, linkUrl);
      break;
    case "toClassic":
      toEnvironment(tab, true, classic, linkUrl);
      break;
    default:
      break;
  }
}

type CommandEnvs = "toLive" | "toPerf" | "toProd" | "toAuthor";

commands.onCommand.addListener((command, tab) => {
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
type ConditionType = {
  isTrue: (url: string) => Promise<boolean>;
  result: () => ResultType;
};

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

async function resolveModule(scriptPath: string) {
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
}: WebNavigation.OnCompletedDetailsType) {
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

  try {
    const cssResource = `${injectScript}.css`;
    const { status } = await axios.request({ url: cssResource });

    if (status === 200) {
      scripting.insertCSS({
        target,
        files: [cssResource],
      });
    }
  } catch (err) {
    console.warn("css resource not exist");
  }
}
