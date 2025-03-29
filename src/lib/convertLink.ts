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

interface OriginalPathType {
  map?: { originalPath?: string };
}

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

  const matchSiteWide = regexFixSWAuthor.exec(urlPart);
  if (!matchSiteWide) {
    throw new Error("Regex not matched url part");
  }

  const [, siteWide, partWithoutContent] = matchSiteWide;

  if (siteWide === "site-wide-content") {
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

  const regexFastAuthor = await getRegexFastAuthor();

  if (isAuthor) {
    if (env === "cf#" || env === "editor.html") {
      const matchFastAuthor = regexFastAuthor.exec(url.href);

      if (!matchFastAuthor) {
        throw new Error("Regex not matched fast author");
      }

      const [, linkDomain, authorPart, authorEnv, , linkContent, htmlPart] =
        matchFastAuthor;

      newUrl = `${linkDomain}${authorPart !== "author" ? "author" : ""}${authorEnv}${env}/${linkContent}${
        htmlPart !== "html" ? ".html" : ""
      }`;

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

  return `https://www.${localLanguage ?? ""}${topLevelDomain}.${market}${britain}${urlPart}`;
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

  return `https://${domainPerfProd}${betaString(beta)}-${market}${localLanguage ?? ""}.${domain}.${topLevelDomain}.com${urlPart}`;
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

  const regexFixSiteWide = await getRegexFixSiteWide();

  const matchFixSiteWide = regexFixSiteWide.exec(wrongLink);
  if (!matchFixSiteWide) {
    throw new Error("Regex not matched site wide");
  }

  const [, linkDomain, , linkContent, linkPart] = matchFixSiteWide;

  if (linkContent === "content") {
    wrongLink = `${linkDomain}/site-wide-content${linkPart}`;
  }

  const fullAuthorPath = await getFullAuthorPath();
  const pathToResolver = await getPathToResolver();

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
  let market: string | null = null;
  let localLanguage = "";
  let urlPart: string;
  let isAuthor = false;

  const regexAuthor = await getRegexAuthor();
  const regexLive = await getRegexLive();
  const regexPerfProd = await getRegexPerfProd();

  urlPart = url.pathname + url.search + url.hash;
  if (urlPart === "/") {
    urlPart = "";
  }

  console.log(regexLive.exec(url.href));

  const matchLive = regexLive.exec(url.href);
  if (matchLive) {
    const [, localLanguageTemp, topLevelDomain, domain] = matchLive;

    console.log(localLanguageTemp);
    console.log(topLevelDomain);

    market = domain || topLevelDomain;
    localLanguage = domain ? topLevelDomain : localLanguageTemp;
  }

  const matchPerfProd = regexPerfProd.exec(url.href);
  if (matchPerfProd) {
    const [, , topLevelDomain, domain] = matchPerfProd;

    const isUk = domain === "uk";

    market = isUk ? domain : topLevelDomain;
    localLanguage = isUk ? topLevelDomain : domain;
  }

  const matchAuthor = regexAuthor.exec(url.href);
  if (matchAuthor) {
    market = matchAuthor[4];
    localLanguage = fixLocalLanguage(matchAuthor[5], market);

    // fix resource resolver not working if link not ending with html
    url.hash = "";
    url.search = "";

    isAuthor = true;
  }

  if (market == null) {
    throw new Error(`${url} doesn't match any of the env`);
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
