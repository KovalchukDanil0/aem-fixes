import axios from "axios";
import { tabs, Tabs } from "webextension-polyfill";
import {
  getDomain,
  getDomainPerf,
  getDomainProd,
  getFullAuthorPath,
  getPathToResolver,
  getRegexAuthor,
  getRegexFastAuthor,
  getRegexFixSiteWide,
  getRegexLive,
  getRegexPerfProd,
  getTopLevelDomain,
} from "./storage";
import { EnvTypesExtended, MessageCommon } from "./types";

const marketsInBeta: string[] = [
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

const marketsHomeNew: string[] = [
  "ie",
  "fi",
  "be",
  "cz",
  "hu",
  "gr",
  "ro",
  "lu",
];

export const isMarketInBeta = (market: string): boolean =>
  !!marketsInBeta.some((link) => market.includes(link));

export const betaString = (beta: boolean): string => (beta ? "-beta" : "");

const isMarketHasHomeNew = (market: string): boolean =>
  !!marketsHomeNew.some((mar) => market.includes(mar));

export function fixMarket(market: string): string {
  const marketsFixAuthor = ["gb", "en", "gl"];
  const marketsFixPerf = ["uk", "uk", "mothersite"];

  const idxAuthor = marketsFixAuthor.indexOf(market);
  if (idxAuthor >= 0) {
    return marketsFixPerf[idxAuthor];
  }

  const idxPerf = marketsFixPerf.indexOf(market);
  if (idxPerf >= 0) {
    return marketsFixAuthor[idxPerf];
  }

  return market;
}

export function fixLocalLanguage(
  localLanguage: string,
  market: string,
  toAuthor = false,
): string {
  if (localLanguage === market) {
    localLanguage = "";
    return localLanguage;
  }

  const properties = {
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

  const marketProp = properties[market as keyof typeof properties];

  if (marketProp) {
    localLanguage = marketProp[+toAuthor];
  }

  return localLanguage;
}

function fixUrlPart(urlPart: string): string {
  const regexFixSWAuthor =
    /\S+?(site-wide-content|home-new|home)((?:\S+)?(?=\.html)|\S+)(?:\S+)?/gm;

  const partWithoutContent = urlPart.replace(regexFixSWAuthor, "$2");

  if (urlPart.replace(regexFixSWAuthor, "$1") === "site-wide-content") {
    urlPart = `/content${partWithoutContent}`;
  } else {
    urlPart = partWithoutContent;
  }

  return urlPart;
}

async function getPerfRealUrl(
  { href }: URL,
  regexAuthor: RegExp,
): Promise<string> {
  let html: Document | null = null;

  if (!regexAuthor.test(href)) {
    const regexDeleteEnv = /\/(?:editor\.html|cf#)/gm;
    const toEnvUrl = href.replace(regexDeleteEnv, "");

    const { data: htmlResponse } = await axios.get(toEnvUrl, {
      headers: { "User-Agent": "request" },
    });
    html = htmlResponse;
  }

  const tab: Tabs.Tab = (
    await tabs.query({ url: href, currentWindow: true })
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

  return fixUrlPart(realPerfUrl);
}

async function determineEnv(
  env: EnvTypesExtended,
  url: URL,
  regexAuthor: RegExp,
  isAuthor: boolean,
  market: string,
  localLanguage: string,
  urlPart: string,
  beta: boolean,
): Promise<string> {
  let newUrl: string;

  const regexFastAuthorCached = await getRegexFastAuthor();

  if (isAuthor) {
    if (env === "cf#" || env === "editor.html") {
      const notContainsAuthor: boolean =
        url.href.replace(regexFastAuthorCached, "$2") !== "author";
      const notContainsHtml: boolean =
        url.href.replace(regexFastAuthorCached, "$6") !== "html";

      newUrl = url.href.replace(
        regexFastAuthorCached,
        `$1${notContainsAuthor ? "author" : ""}$3${env + "/"}$5${
          notContainsHtml ? ".html" : ""
        }`,
      );

      return newUrl;
    }

    urlPart = await getPerfRealUrl(url, regexAuthor);
  }

  switch (env) {
    case "live":
      newUrl = await makeLive(market, localLanguage, urlPart);
      break;
    case "perf":
      newUrl = await makePerfProd(true, market, localLanguage, urlPart, beta);
      break;
    case "prod":
      newUrl = await makePerfProd(false, market, localLanguage, urlPart, beta);
      break;
    case "editor.html":
      newUrl = await makeAuthor(true, market, beta, urlPart, localLanguage);
      break;
    case "cf#":
      newUrl = await makeAuthor(false, market, beta, urlPart, localLanguage);
      break;
    default:
      throw new Error(`No such environment ${env}`);
  }

  return newUrl;
}

async function makeLive(
  market: string,
  localLanguage: string,
  urlPart: string,
): Promise<string> {
  let britain = "";
  if (market === "uk") {
    britain = "uk";
    market = "co.";
    localLanguage = "";
  }

  if (localLanguage) {
    localLanguage += ".";
  }

  const topLevelDomain = await getTopLevelDomain();

  return `https://www.${localLanguage}${topLevelDomain}.${market}${britain}${urlPart}`;
}

async function makePerfProd(
  isPerf: boolean,
  market: string,
  localLanguage: string,
  urlPart: string,
  beta: boolean,
): Promise<string> {
  if (market === "uk" || market === "gb") {
    market = "co";
    localLanguage = "uk";
  }

  const domain = await getDomain();
  const topLevelDomain = await getTopLevelDomain();

  const domainPerfProd = isPerf ? await getDomainPerf() : await getDomainProd();

  return `https://${domainPerfProd}${betaString(beta)}-${market}${localLanguage}.${domain}.${topLevelDomain}.com${urlPart}`;
}

async function makeAuthor(
  isTouch: boolean,
  market: string,
  beta: boolean,
  urlPart: string,
  localLanguage: string,
): Promise<string> {
  let wrongLink = `/content/guxeu${betaString(beta)}/${
    market
  }/${fixLocalLanguage(localLanguage, market, true)}_${fixMarket(market)}/${
    isMarketHasHomeNew(market) && !urlPart ? "home-new" : "home"
  }${urlPart}`;

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

  return makeRealAuthorLink(originalPath, fullAuthorPath, isTouch);
}

function makeRealAuthorLink(
  wrongLink: string,
  fullAuthorPath: string,
  isTouch: boolean,
): string {
  return `https://${fullAuthorPath}/${isTouch ? "editor.html" : "cf#"}${wrongLink}.html`;
}

export async function convertLink(
  env: EnvTypesExtended,
  url: URL,
): Promise<string> {
  let market: string;
  let localLanguage: string;
  let urlPart: string;

  let isAuthor = false;
  const regexAuthor = await getRegexAuthor();

  urlPart = url.pathname + url.search + url.hash;
  if (urlPart === "/") {
    urlPart = "";
  }

  const regexLiveCached = await getRegexLive();
  const regexPerfProdCached = await getRegexPerfProd();

  // Live
  if (regexLiveCached.test(url.href)) {
    const topLevelDomain = url.href.replace(regexLiveCached, "$2");
    const domain = url.href.replace(regexLiveCached, "$3");

    if (!domain) {
      market = topLevelDomain;
      localLanguage = url.href.replace(regexLiveCached, "$1");
    } else {
      market = domain;
      localLanguage = topLevelDomain;
    }
  }
  // Perf & Prod
  else if (regexPerfProdCached.test(url.href)) {
    const topLevelDomain = url.href.replace(regexPerfProdCached, "$2");
    const domain = url.href.replace(regexPerfProdCached, "$3");

    if (domain === "uk") {
      market = domain;
      localLanguage = topLevelDomain;
    } else {
      market = topLevelDomain;
      localLanguage = domain;
    }
  }
  // Author
  else if (regexAuthor.test(url.href)) {
    market = url.href.replace(regexAuthor, "$4");

    localLanguage = fixLocalLanguage(
      url.href.replace(regexAuthor, "$5"),
      market,
    );

    // fix resource resolver not working if link not ending with html
    url.hash = "";
    url.search = "";

    isAuthor = true;
  } else {
    throw new Error(`${url} doesn't math any of the env`);
  }

  const beta = isMarketInBeta(market);

  return determineEnv(
    env,
    url,
    regexAuthor,
    isAuthor,
    market,
    localLanguage,
    urlPart,
    beta,
  );
}
