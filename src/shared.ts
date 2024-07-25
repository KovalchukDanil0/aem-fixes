import axios from "axios";
import Browser, { Tabs } from "webextension-polyfill";

export const touch = "editor.html";
export const classic = "cf#";

export const getLocalSavedData = async (): Promise<SavedLocalData> =>
  Browser.storage.local.get() as Promise<SavedLocalData>;

async function regexJira(): Promise<RegExp> {
  const data = await getLocalSavedData();
  return new RegExp(data.secretSettings.regexJira);
}

export const ifJira = async (url: string): Promise<boolean> =>
  (await regexJira()).test(url);

export async function regexWorkflow(): Promise<RegExp> {
  const data = await getLocalSavedData();
  return new RegExp(data.secretSettings.regexWorkflow);
}

const ifWorkflow = async (url: string): Promise<boolean> =>
  (await regexWorkflow()).test(url);

export async function regexDAMTree(): Promise<RegExp> {
  const data = await getLocalSavedData();
  return new RegExp(data.secretSettings.regexDAMTree);
}

export async function regexLive(): Promise<RegExp> {
  const data = await getLocalSavedData();
  return new RegExp(data.secretSettings.regexLive);
}

export const ifLive = async (url: string): Promise<boolean> =>
  (await regexLive()).test(url);

async function regexPerfProd(): Promise<RegExp> {
  const data = await getLocalSavedData();
  return new RegExp(data.secretSettings.regexPerfProd);
}

export const ifPerfProd = async (url: string): Promise<boolean> =>
  (await regexPerfProd()).test(url);

export const ifPerf = async (url: string): Promise<boolean> =>
  url.replace(await regexPerfProd(), "$1") === "perf";
export const ifProd = async (url: string): Promise<boolean> =>
  url.replace(await regexPerfProd(), "$1") === "prod";

export async function regexAuthor(): Promise<RegExp> {
  const data = await getLocalSavedData();
  return new RegExp(data.secretSettings.regexAuthor);
}

export const ifAuthor = async (url: string): Promise<boolean> =>
  (await regexAuthor()).test(url);
export const ifAuthorNoEnv = async (url: string): Promise<boolean> =>
  url.replace(await regexAuthor(), "$2") === "";
export const ifClassic = async (url: string): Promise<boolean> =>
  url.replace(await regexAuthor(), "$2") === classic;
export const ifTouch = async (url: string): Promise<boolean> =>
  url.replace(await regexAuthor(), "$2") === touch;

export const ifAnyOfTheEnv = async (url: string) =>
  (await regexLive()).test(url) ||
  (await regexPerfProd()).test(url) ||
  (await regexAuthor()).test(url);

export async function regexDetermineBeta(): Promise<RegExp> {
  const data = await getLocalSavedData();
  return new RegExp(data.secretSettings.regexDetermineBeta);
}

async function regexFastAuthor(): Promise<RegExp> {
  const data = await getLocalSavedData();
  return new RegExp(data.secretSettings.regexFastAuthor);
}

async function regexFixSiteWide(): Promise<RegExp> {
  const data = await getLocalSavedData();
  return new RegExp(data.secretSettings.regexFixSiteWide);
}

export async function regexWFTitle(): Promise<RegExp> {
  const data = await getLocalSavedData();
  return new RegExp(data.secretSettings.regexWFTitle);
}

async function getDomain(): Promise<string> {
  const data = await getLocalSavedData();
  return data.secretSettings.domain;
}

export async function getFullAuthorPath(): Promise<string> {
  const data = await getLocalSavedData();
  return data.secretSettings.fullAuthorPath;
}

async function getPathToResolver(): Promise<string> {
  const data = await getLocalSavedData();
  return data.secretSettings.pathToResolver;
}

async function getTopLevelDomain(): Promise<string> {
  const data = await getLocalSavedData();
  return data.secretSettings.topLevelDomain;
}

async function getDomainPerf(): Promise<string> {
  const data = await getLocalSavedData();
  return data.secretSettings.domainPerf;
}

async function getDomainProd(): Promise<string> {
  const data = await getLocalSavedData();
  return data.secretSettings.domainProd;
}

export async function getWorkflowPath(): Promise<string> {
  const data = await getLocalSavedData();
  return data.secretSettings.workflowPath;
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
  | "checkMothersite";
export type EnvTypes = "live" | "perf" | "prod" | "author";
export type EnvTypesNoAuthor = EnvTypes | "editor.html" | "cf#";
export type FromTypes = "popup" | "background" | "content";
export type ColorProps = "info" | "success" | "warning" | "error";

export type MessageCommon = {
  from: FromTypes;
  subject: SubjectTypes | null;
  url?: string;
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
  data: {
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
  url?: URL;

  market = "xx";
  localLanguage = "xx";
  urlPart = "/";

  beta = false;
  isAuthor = false;

  regexAuthorCached?: RegExp;

  marketsInBeta: string[] = [
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

  marketsHomeNew: string[] = ["ie", "fi", "be", "cz", "hu", "gr", "ro", "lu"];

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

    const regexLiveCached: RegExp = await regexLive();
    const regexPerfProdCached = await regexPerfProd();
    this.regexAuthorCached = await regexAuthor();

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

    this.beta = !!this.marketsInBeta.some((link): boolean =>
      this.market.includes(link),
    );

    return this.betaString();
  }

  isMarketHasHomeNew = (): boolean =>
    !!this.marketsHomeNew.some((mar): boolean => this.market.includes(mar));

  betaString = (): string => (this.beta ? "-beta" : "");

  fixMarket(someMarket?: string) {
    if (someMarket) {
      this.market = someMarket;
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

      html = (
        await axios
          .get(toEnvUrl, { headers: { "User-Agent": "request" } })
          .catch(() => null)
      )?.data;
    }

    if (!this.url) {
      throw new Error("Url is undefined");
    }

    const tab: Tabs.Tab = (
      await Browser.tabs.query({ url: this.url?.href, currentWindow: true })
    )[0];

    if (!tab.id) {
      throw new Error("tab id is undefined");
    }

    const realPerfUrl: string | null = await Browser.tabs.sendMessage(tab.id, {
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

  async determineEnv(env: EnvTypesNoAuthor): Promise<string> {
    let newUrl: string | undefined;

    const regexFastAuthorCached = await regexFastAuthor();

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

    const regexFixSiteWideCached = await regexFixSiteWide();

    if (wrongLink.replace(regexFixSiteWideCached, "$3") === "content") {
      wrongLink = wrongLink.replace(
        regexFixSiteWideCached,
        "$1/site-wide-content$4",
      );
    }

    const fullAuthorPath = await getFullAuthorPath();
    const pathToResolver = await getPathToResolver();

    const resolver = await axios
      .get(`https://${fullAuthorPath}/${pathToResolver}` + wrongLink, {
        headers: {
          Accept: "application/json",
        },
      })
      .catch(() => null);

    if (!resolver?.data) {
      throw new Error("Failed to load resolver");
    }

    const customResolverData: { map: { originalPath: string } } = resolver.data;

    return this.makeRealAuthorLink(
      customResolverData.map.originalPath,
      fullAuthorPath,
      isTouch,
    );
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
  doc: Document = document,
): Promise<T> {
  return new Promise((resolve) => {
    if (doc.querySelector(selector)) {
      return resolve(doc.querySelector(selector) as T);
    }

    const observer = new MutationObserver(() => {
      if (doc.querySelector(selector)) {
        resolve(doc.querySelector(selector) as T);
        observer.disconnect();
      }
    });

    observer.observe(doc.body, {
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
  Browser.storage.sync.get({
    disCreateWF: false,
    disMothersiteCheck: false,
    enableFunErr: false,
    enableFilterFix: false,
    enableAutoLogin: false,
  } as SavedSyncData);

export const getCurrentTab = async (): Promise<Browser.Tabs.Tab> =>
  (await Browser.tabs.query({ active: true, currentWindow: true }))[0];

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
