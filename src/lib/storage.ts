import { storage } from "webextension-polyfill";
import { SavedSyncData } from "./types";

export type SavedLocalData = {
  secretSettings: {
    regexJira: string;
    regexLive: string;
    regexPerfProd: string;
    regexAuthor: string;
    regexWorkflow: string;
    regexDAMTree: string;
    regexFastAuthor: string;
    regexFixSiteWide: string;
    regexImagePicker: string;
    regexHTMLExist: string;
    regexWFTitle: string;
    domain: string;
    domainAuthor: string;
    domainPerf: string;
    domainProd: string;
    topLevelDomain: string;
    secretWord: string;
    pathToResolver: string;
    pathToReferences: string;
    pathToReferencesParams: string;
    fullAuthorPath: string;
    propertiesPath: string;
    workflowPath: string;
    jiraFullPath: string;
    findReplaceUrl: string;
    DAMTreeUrl: string;
    regexDetermineBeta: string;
  };
};

export const getLocalSavedData = async (): Promise<SavedLocalData> =>
  storage.local.get() as Promise<SavedLocalData>;

async function getRegexJira(): Promise<RegExp> {
  const {
    secretSettings: { regexJira },
  } = await getLocalSavedData();
  return new RegExp(regexJira);
}

export const ifJira = async (url: string): Promise<boolean> =>
  (await getRegexJira()).test(url);

export async function getRegexWorkflow(): Promise<RegExp> {
  const {
    secretSettings: { regexWorkflow },
  } = await getLocalSavedData();
  return new RegExp(regexWorkflow);
}

export const ifWorkflow = async (url: string): Promise<boolean> =>
  (await getRegexWorkflow()).test(url);

export async function getRegexDAMTree(): Promise<RegExp> {
  const {
    secretSettings: { regexDAMTree },
  } = await getLocalSavedData();
  return new RegExp(regexDAMTree);
}

export async function getRegexLive(): Promise<RegExp> {
  const {
    secretSettings: { regexLive },
  } = await getLocalSavedData();
  return new RegExp(regexLive);
}

export const ifLive = async (url: string): Promise<boolean> =>
  (await getRegexLive()).test(url);

export async function getRegexPerfProd(): Promise<RegExp> {
  const {
    secretSettings: { regexPerfProd },
  } = await getLocalSavedData();
  return new RegExp(regexPerfProd);
}

export const ifPerfProd = async (url: string): Promise<boolean> =>
  (await getRegexPerfProd()).test(url);

export const ifPerf = async (url: string): Promise<boolean> =>
  url.replace(await getRegexPerfProd(), "$1") === "perf";
export const ifProd = async (url: string): Promise<boolean> =>
  url.replace(await getRegexPerfProd(), "$1") === "prod";

export async function getRegexAuthor(): Promise<RegExp> {
  const {
    secretSettings: { regexAuthor },
  } = await getLocalSavedData();
  return new RegExp(regexAuthor);
}

export const ifAuthor = async (url: string): Promise<boolean> =>
  (await getRegexAuthor()).test(url);
export const ifAuthorNoEnv = async (url: string): Promise<boolean> =>
  url.replace(await getRegexAuthor(), "$2") === "";
export const ifClassic = async (url: string): Promise<boolean> =>
  url.replace(await getRegexAuthor(), "$2") === "cf#";
export const ifTouch = async (url: string): Promise<boolean> =>
  url.replace(await getRegexAuthor(), "$2") === "editor.html";

export const ifAnyOfTheEnv = async (url: string) =>
  (await getRegexLive()).test(url) ||
  (await getRegexPerfProd()).test(url) ||
  (await getRegexAuthor()).test(url);

export async function getRegexDetermineBeta(): Promise<RegExp> {
  const {
    secretSettings: { regexDetermineBeta },
  } = await getLocalSavedData();
  return new RegExp(regexDetermineBeta);
}

export async function getRegexFastAuthor(): Promise<RegExp> {
  const {
    secretSettings: { regexFastAuthor },
  } = await getLocalSavedData();
  return new RegExp(regexFastAuthor);
}

export async function getRegexFixSiteWide(): Promise<RegExp> {
  const {
    secretSettings: { regexFixSiteWide },
  } = await getLocalSavedData();
  return new RegExp(regexFixSiteWide);
}

export async function getRegexWFTitle(): Promise<RegExp> {
  const {
    secretSettings: { regexWFTitle },
  } = await getLocalSavedData();
  return new RegExp(regexWFTitle);
}

export async function getDomain(): Promise<string> {
  const {
    secretSettings: { domain },
  } = await getLocalSavedData();
  return domain;
}

export async function getFullAuthorPath(): Promise<string> {
  const {
    secretSettings: { fullAuthorPath },
  } = await getLocalSavedData();
  return fullAuthorPath;
}

export async function getPathToResolver(): Promise<string> {
  const {
    secretSettings: { pathToResolver },
  } = await getLocalSavedData();
  return pathToResolver;
}

export async function getTopLevelDomain(): Promise<string> {
  const {
    secretSettings: { topLevelDomain },
  } = await getLocalSavedData();
  return topLevelDomain;
}

export async function getDomainPerf(): Promise<string> {
  const {
    secretSettings: { domainPerf },
  } = await getLocalSavedData();
  return domainPerf;
}

export async function getDomainProd(): Promise<string> {
  const {
    secretSettings: { domainProd },
  } = await getLocalSavedData();
  return domainProd;
}

export async function getWorkflowPath(): Promise<string> {
  const {
    secretSettings: { workflowPath },
  } = await getLocalSavedData();
  return workflowPath;
}

export const loadSavedData = async (): Promise<SavedSyncData> =>
  storage.sync.get({
    disCreateWF: false,
    disMothersiteCheck: false,
    enableFunErr: false,
    enableFilterFix: false,
    enableAutoLogin: false,
  });
