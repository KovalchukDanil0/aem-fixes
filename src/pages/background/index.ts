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

function aemLinkError(error: Error) {
  const message: MessageAlert = {
    from: "background",
    subject: "showMessage",
    color: "error",
    message: `ERROR - ${error.message}`,
  };

  runtime.sendMessage(message);
}

function toEnvironment(
  activeTabs: Tabs.Tab[],
  newTab: boolean,
  env: EnvTypesExtended,
  url?: string,
) {
  activeTabs.forEach(async (tab) => {
    const initUrl: string | undefined = url ?? tab.url;

    const data = new AEMLink(initUrl);
    await data.initialize();

    const newUrl = await data.determineEnv(env).catch(aemLinkError);

    if (!newUrl) {
      throw new Error("newUrl is undefined");
    }

    if (newTab) {
      tabs.create({ index: tab.index + 1, url: newUrl });
    } else {
      tabs.update(tab.id, {
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

const openInTree = async function (authorUrl: string | undefined) {
  authorUrl = authorUrl?.replace(await regexAuthor(), "$3");

  const fullAuthorPath = await getFullAuthorPath();

  changeContentInTab(authorUrl, `https://${fullAuthorPath}/siteadmin`);
};

runtime.onMessage.addListener((msg: MessageEnv, _sender, _sendResponse) => {
  if (msg.from !== "background") {
    if (msg.subject === "toEnvironment") {
      toEnvironment(msg.tabs, msg.newTab, msg.env);
    }

    if (msg.subject === "openInTree") {
      const url = msg.url ?? msg.tabs?.[msg.tabs?.length - 1].url;
      openInTree(url);
    }
  }
});

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

  const parent = contextMenus.create({
    title: "To Environment",
    contexts: ["link"],
    id: "toEnvironment",
  });

  contextMenus.create({
    title: "To Live",
    contexts: ["link"],
    parentId: parent,
    id: "toLive",
  });

  contextMenus.create({
    title: "To Perf",
    contexts: ["link"],
    parentId: parent,
    id: "toPerf",
  });

  contextMenus.create({
    title: "To Prod",
    contexts: ["link"],
    parentId: parent,
    id: "toProd",
  });

  contextMenus.create({
    title: "To Touch",
    contexts: ["link"],
    parentId: parent,
    id: "toTouch",
  });

  contextMenus.create({
    title: "To Classic",
    contexts: ["link"],
    parentId: parent,
    id: "toClassic",
  });
});

async function menusOnClick(
  info: Menus.OnClickData,
  patternTabs: Tabs.Tab | undefined,
) {
  if (!patternTabs) {
    throw new Error("tabs in menus are undefined");
  }

  const fullAuthorPath = await getFullAuthorPath();

  const tab: Tabs.Tab[] = [patternTabs];
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
      const linkUrl = info.selectionText
        ? `https://${fullAuthorPath}${info.selectionText}.html`
        : info.linkUrl;
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
      tabs.create({
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

type CommandEnvs = "toLive" | "toPerf" | "toProd" | "toAuthor";

contextMenus.onClicked.addListener(menusOnClick);

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

webNavigation.onCompleted.addListener(onLoadingComplete);
