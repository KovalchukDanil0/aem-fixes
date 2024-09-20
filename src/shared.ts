import axios from "axios";
import { storage, tabs, Tabs } from "webextension-polyfill";

export const touch = "editor.html";
export const classic = "cf#";

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

const ifWorkflow = async (url: string): Promise<boolean> =>
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

async function getRegexPerfProd(): Promise<RegExp> {
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
  url.replace(await getRegexAuthor(), "$2") === classic;
export const ifTouch = async (url: string): Promise<boolean> =>
  url.replace(await getRegexAuthor(), "$2") === touch;

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

async function getRegexFastAuthor(): Promise<RegExp> {
  const {
    secretSettings: { regexFastAuthor },
  } = await getLocalSavedData();
  return new RegExp(regexFastAuthor);
}

async function getRegexFixSiteWide(): Promise<RegExp> {
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

async function getDomain(): Promise<string> {
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

async function getPathToResolver(): Promise<string> {
  const {
    secretSettings: { pathToResolver },
  } = await getLocalSavedData();
  return pathToResolver;
}

async function getTopLevelDomain(): Promise<string> {
  const {
    secretSettings: { topLevelDomain },
  } = await getLocalSavedData();
  return topLevelDomain;
}

async function getDomainPerf(): Promise<string> {
  const {
    secretSettings: { domainPerf },
  } = await getLocalSavedData();
  return domainPerf;
}

async function getDomainProd(): Promise<string> {
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

export type ConfigurationModeType = "production" | "development" | "none";

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

export type SavedSyncData = {
  disCreateWF?: boolean;
  disMothersiteCheck?: boolean;
  enableAutoLogin?: boolean;
  enableFilterFix?: boolean;
  enableFunErr?: boolean;
};

export type SubjectTypes =
  | "checkReferences"
  | "getRealUrl"
  | "toEnvironment"
  | "showMessage"
  | "openInTree"
  | "createWF"
  | "checkMothersite"
  | "getCookie";
export type EnvTypes = "live" | "perf" | "prod" | "author";
export type EnvTypesExtended = EnvTypes | "editor.html" | "cf#";
export type FromTypes = "popup" | "background" | "content";
export type ColorProps = "info" | "success" | "warning" | "error";

export type MessageCommon = {
  from: FromTypes;
  subject: SubjectTypes | null;
};

export type MessageEnv = {
  env: EnvTypes;
  tabs: Tabs.Tab[];
  newTab: boolean;
} & MessageCommon;

export type MessageAlert = {
  message: string;
  color: ColorProps;
} & MessageCommon;

export interface ShowroomCode {
  showroomConfig: {
    [key: string]: {
      code: string;
      name: string;
    };
  };
}

export interface ReferencesConfig {
  pages: {
    path: string;
  }[];
}

export default class AEMLink {
  readonly url?: URL;

  market: string | null = null;
  localLanguage: string | null = null;
  urlPart = "";

  beta = false;
  isAuthor = false;

  regexAuthorCached?: RegExp;

  readonly marketsInBeta: string[] = [
    "uk",
    "de",
    "es",
    "fr",
    "nl",
    "it",
    "no",
    "at",
    "pt",
    "pl",
    "dk",
  ];

  readonly marketsHomeNew: string[] = [
    "ie",
    "fi",
    "be",
    "cz",
    "hu",
    "gr",
    "ro",
    "lu",
  ];

  constructor(url?: string) {
    if (!url) {
      return;
    }

    this.url = new URL(url);

    this.urlPart = this.url.pathname + this.url.search + this.url.hash;
    if (this.urlPart === "/") {
      this.urlPart = "";
    }
  }

  async initialize() {
    if (!this.url) {
      return;
    }

    const regexLiveCached = await getRegexLive();
    const regexPerfProdCached = await getRegexPerfProd();
    this.regexAuthorCached = await getRegexAuthor();

    // Live
    if (regexLiveCached.test(this.url.href)) {
      if (!this.url.href.replace(regexLiveCached, "$3")) {
        this.market = this.url.href.replace(regexLiveCached, "$2");
        this.localLanguage = this.url.href.replace(regexLiveCached, "$1");
      } else {
        this.market = this.url.href.replace(regexLiveCached, "$3");
        this.localLanguage = this.url.href.replace(regexLiveCached, "$2");
      }
    }
    // Perf & Prod
    else if (regexPerfProdCached.test(this.url.href)) {
      if (this.url.href.replace(regexPerfProdCached, "$3") === "uk") {
        this.market = this.url.href.replace(regexPerfProdCached, "$3");
        this.localLanguage = this.url.href.replace(regexPerfProdCached, "$2");
      } else {
        this.market = this.url.href.replace(regexPerfProdCached, "$2");
        this.localLanguage = this.url.href.replace(regexPerfProdCached, "$3");
      }
    }
    // Author
    else if (this.regexAuthorCached.test(this.url.href)) {
      this.market = this.url.href.replace(this.regexAuthorCached, "$4");
      this.localLanguage = this.fixLocalLanguage(
        false,
        this.url.href.replace(this.regexAuthorCached, "$5"),
      );

      // fix resource resolver not working if link not ending with html
      this.url.hash = "";
      this.url.search = "";

      this.isAuthor = true;
    } else {
      throw new Error("Link doesn't math any of the env");
    }

    this.isMarketInBeta();
  }

  isMarketInBeta(someMarket?: string): string {
    if (someMarket) {
      this.market = someMarket;
    }

    this.beta = !!this.marketsInBeta.some((link) =>
      this.market?.includes(link),
    );

    return this.betaString();
  }

  isMarketHasHomeNew = (): boolean =>
    !!this.marketsHomeNew.some((mar) => this.market?.includes(mar));

  betaString = (): string => (this.beta ? "-beta" : "");

  fixMarket(someMarket?: string) {
    if (someMarket) {
      this.market = someMarket;
    }

    if (!this.market) {
      throw new Error("market is undefined");
    }

    const marketsFixAuthor = ["gb", "en", "gl"];
    const marketsFixPerf = ["uk", "uk", "mothersite"];

    let idx = marketsFixAuthor.indexOf(this.market);
    if (idx >= 0) {
      return marketsFixPerf[idx];
    }

    idx = marketsFixPerf.indexOf(this.market);
    if (idx >= 0) {
      return marketsFixAuthor[idx];
    }

    return this.market;
  }

  fixLocalLanguage(toAuthor = true, someLocalLang?: string) {
    if (someLocalLang) {
      this.localLanguage = someLocalLang;
    }

    const properties: {
      [key: string]: string[];
    } = {
      uk: ["co", "en"],
      ie: ["", "en"],
      fr: ["", "fr"],
      lu: ["", "fr"],
      de: ["", "de"],
      at: ["", "de"],
      dk: ["", "da"],
      cz: ["", "cs"],
      gr: ["", "el"],
      fi: ["", "fi"],
      hu: ["", "hu"],
      ro: ["", "ro"],
      es: ["", "es"],
      nl: ["", "nl"],
      it: ["", "it"],
      no: ["", "no"],
      pt: ["", "pt"],
      pl: ["", "pl"],
    };

    const marketProp = properties[this.market as keyof typeof properties];
    if (marketProp) {
      this.localLanguage = marketProp[+toAuthor];
    }

    return this.localLanguage;
  }

  fixUrlPart(someUrlPart?: string): string {
    someUrlPart = someUrlPart ?? this.urlPart;

    const regexFixSWAuthor =
      /\S+?(site-wide-content|home-new|home)((?:\S+)?(?=\.html)|\S+)(?:\S+)?/gm;

    if (someUrlPart.replace(regexFixSWAuthor, "$1") === "site-wide-content") {
      someUrlPart = someUrlPart.replace(regexFixSWAuthor, "/content$2");
    } else {
      someUrlPart = someUrlPart.replace(regexFixSWAuthor, "$2");
    }

    return someUrlPart;
  }

  async getPerfRealUrl() {
    let html: Document | null = null;
    const tabUrl = this.url?.href;

    if (!tabUrl) {
      throw new Error("tab url is undefined");
    }

    if (!this.regexAuthorCached?.test(tabUrl)) {
      const regexDeleteEnv = /\/(?:editor\.html|cf#)/gm;
      const toEnvUrl = tabUrl.replace(regexDeleteEnv, "");

      const { data: htmlResponse } = await axios.get(toEnvUrl, {
        headers: { "User-Agent": "request" },
      });
      html = htmlResponse;
    }

    if (!this.url) {
      throw new Error("Url is undefined");
    }

    const tab: Tabs.Tab = (
      await tabs.query({ url: this.url.href, currentWindow: true })
    )[0];

    if (!tab.id) {
      throw new Error("tab id is undefined");
    }

    const realPerfUrl: string | null = await tabs.sendMessage(tab.id, {
      from: "background",
      subject: "getRealUrl",
      html,
    } as MessageCommon);

    if (!realPerfUrl) {
      throw new Error(
        "Cannot get the alias of the page, make sure you on TouchUI page or try to reload page",
      );
    }

    this.urlPart = this.fixUrlPart(realPerfUrl);

    return this.urlPart;
  }

  async determineEnv(env: EnvTypesExtended): Promise<string> {
    let newUrl: string | undefined;

    const regexFastAuthorCached = await getRegexFastAuthor();

    if (this.isAuthor && this.url) {
      if (env === classic || env === touch) {
        const notContainsAuthor: boolean =
          this.url.href.replace(regexFastAuthorCached, "$2") !== "author";
        const notContainsHtml: boolean =
          this.url.href.replace(regexFastAuthorCached, "$6") !== "html";

        newUrl = this.url.href.replace(
          regexFastAuthorCached,
          `$1${notContainsAuthor ? "author" : ""}$3${env + "/"}$5${
            notContainsHtml ? ".html" : ""
          }`,
        );

        return newUrl;
      }

      this.urlPart = await this.getPerfRealUrl();
    }

    switch (env) {
      case "live":
        newUrl = await this.makeLive();
        break;
      case "perf":
        newUrl = await this.makePerf();
        break;
      case "prod":
        newUrl = await this.makeProd();
        break;
      case touch:
        newUrl = await this.makeTouch();
        break;
      case classic:
        newUrl = await this.makeClassic();
        break;
      default:
        throw new Error("No such environment " + env);
    }

    return newUrl;
  }

  async makeLive() {
    let britain = "";
    if (this.market === "uk") {
      britain = this.market;
      this.market = this.localLanguage + ".";
      this.localLanguage = "";
    }

    if (this.localLanguage) {
      this.localLanguage += ".";
    }

    const topLevelDomain = await getTopLevelDomain();

    return `https://www.${this.localLanguage}${topLevelDomain}.${this.market}${britain}${this.urlPart}`;
  }

  makePerf() {
    return this.makePerfProd(true);
  }

  makeProd() {
    return this.makePerfProd(false);
  }

  async makePerfProd(isPerf: boolean) {
    if (this.isAuthor && this.url) {
      // mothersite to perf mothersite logic
    }

    if (this.market === "uk" || this.market === "gb") {
      [this.localLanguage, this.market] = [this.market, this.localLanguage];
    }

    const domain = await getDomain();
    const topLevelDomain = await getTopLevelDomain();

    const domainPerfProd = isPerf
      ? await getDomainPerf()
      : await getDomainProd();

    return `https://${domainPerfProd}${this.betaString()}-${this.market}${this.localLanguage}.${domain}.${topLevelDomain}.com${this.urlPart}`;
  }

  async makeTouch() {
    return this.makeAuthor(true);
  }

  async makeClassic() {
    return this.makeAuthor(false);
  }

  async makeAuthor(isTouch: boolean) {
    let wrongLink = `/content/guxeu${this.betaString()}/${
      this.market
    }/${this.fixLocalLanguage()}_${this.fixMarket()}/${
      this.isMarketHasHomeNew() && !this.urlPart ? "home-new" : "home"
    }${this.urlPart}`;

    const regexFixSiteWideCached = await getRegexFixSiteWide();

    if (wrongLink.replace(regexFixSiteWideCached, "$3") === "content") {
      wrongLink = wrongLink.replace(
        regexFixSiteWideCached,
        "$1/site-wide-content$4",
      );
    }

    const fullAuthorPath = await getFullAuthorPath();
    const pathToResolver = await getPathToResolver();

    type OriginalPathType = { map?: { originalPath?: string } };
    const { data: response } = await axios.get<OriginalPathType>(
      `https://${fullAuthorPath}/${pathToResolver}` + wrongLink,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    const originalPath = response.map?.originalPath;
    if (!originalPath) {
      throw new Error("Please logIn to your AEM account");
    }

    return this.makeRealAuthorLink(originalPath, fullAuthorPath, isTouch);
  }

  makeRealAuthorLink(
    wrongLink: string,
    fullAuthorPath: string,
    isTouch: boolean,
  ) {
    return `https://${fullAuthorPath}/${isTouch ? "editor.html" : "cf#"}${wrongLink}.html`;
  }
}

export function waitForElm<T extends HTMLElement>(
  selector: string,
  elm: Element = document.body,
): Promise<T> {
  return new Promise((resolve) => {
    if (elm.querySelector(selector)) {
      return resolve(elm.querySelector(selector) as T);
    }

    const observer = new MutationObserver(() => {
      if (elm.querySelector(selector)) {
        resolve(elm.querySelector(selector) as T);
        observer.disconnect();
      }
    });

    observer.observe(elm, {
      childList: true,
      subtree: true,
    });
  });
}

export function waitForElmAll<T extends NodeListOf<HTMLElement>>(
  selector: string,
  doc: Document = document,
): Promise<T> {
  return new Promise((resolve) => {
    if (doc.querySelectorAll(selector)) {
      return resolve(doc.querySelectorAll(selector) as T);
    }

    const observer = new MutationObserver(() => {
      if (doc.querySelectorAll(selector)) {
        resolve(doc.querySelectorAll(selector) as T);
        observer.disconnect();
      }
    });

    observer.observe(doc.body, {
      childList: true,
      subtree: true,
    });
  });
}

export const loadSavedData = async (): Promise<SavedSyncData> =>
  storage.sync.get({
    disCreateWF: false,
    disMothersiteCheck: false,
    enableFunErr: false,
    enableFilterFix: false,
    enableAutoLogin: false,
  });

export const getCurrentTab = async (): Promise<Tabs.Tab> =>
  (await tabs.query({ active: true, currentWindow: true }))[0];

export async function findAsyncSequential<T>(
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
