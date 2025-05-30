import ky from "ky";
import { sendMessage } from "./messaging";
import {
  domain,
  domainPerf,
  domainProd,
  fullAuthorPath,
  pathToResolver,
  regexAuthor,
  regexFastAuthor,
  regexFixSiteWide,
  regexLive,
  regexPerfProd,
  topLevelDomain,
} from "./storage";

interface OriginalPathType {
  map: { originalPath: string };
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
  "ch",
];

export const isMarketInBeta = (market: string): boolean =>
  !!marketsInBeta.some((marketBeta) => marketBeta === market);

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
    return "";
  }

  const properties: {
    [market: string]: [string, string] | undefined;
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

  return properties[market]?.[+toAuthor] ?? localLanguage;
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

async function getPerfRealUrl(url: string): Promise<string> {
  let html: Document | null = null;

  if (!regexAuthor.test(url)) {
    const regexDeleteEnv = /\/(?:editor\.html|cf#)/gm;
    const toEnvUrl = url.replace(regexDeleteEnv, "");

    const htmlResponse = await ky
      .get(toEnvUrl, {
        headers: { "User-Agent": "request" },
      })
      .json<Document>();
    html = htmlResponse;
  }

  const [tab] = await browser.tabs.query({ currentWindow: true, url });

  if (!tab.id) {
    throw new Error("tab id is undefined");
  }

  const realPerfUrl = await sendMessage("getRealUrl", { html }, tab.id);

  if (!realPerfUrl) {
    throw new Error(
      "Cannot get the alias of the page, make sure you on TouchUI page or try to reload page",
    );
  }

  return fixUrlPart(realPerfUrl);
}

async function determineEnv(
  env: EnvTypes,
  url: string,
  isAuthor: boolean,
  market: string,
  localLanguage: string,
  urlPart: string,
  beta: boolean,
) {
  let newUrl: string;

  if (isAuthor) {
    if (env === "cf#" || env === "editor.html") {
      const matchFastAuthor = regexFastAuthor.exec(url);
      if (!matchFastAuthor) {
        throw new Error("Regex not matched fast author");
      }

      const [, linkDomain, authorPart, authorEnv, , linkContent, htmlPart] =
        matchFastAuthor;

      newUrl = `${linkDomain}${
        authorPart !== "author" ? "author" : ""
      }${authorEnv}${env}/${linkContent}${htmlPart !== "html" ? ".html" : ""}`;

      return newUrl;
    }

    urlPart = await getPerfRealUrl(url);
  }

  switch (env) {
    case "live":
      newUrl = makeLive(market, localLanguage, urlPart);
      break;
    case "perf":
      newUrl = makePerfProd(true, market, localLanguage, urlPart, beta);
      break;
    case "prod":
      newUrl = makePerfProd(false, market, localLanguage, urlPart, beta);
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

function makeLive(market: string, localLanguage: string, urlPart: string) {
  let britain = "";
  if (market === "uk") {
    britain = "uk";
    market = "co.";
    localLanguage = "";
  }

  if (localLanguage) {
    localLanguage += ".";
  }

  return `https://www.${
    localLanguage ?? ""
  }${topLevelDomain}.${market}${britain}${urlPart}`;
}

function makePerfProd(
  isPerf: boolean,
  market: string,
  localLanguage: string,
  urlPart: string,
  beta: boolean,
) {
  if (market === "uk" || market === "gb") {
    market = "co";
    localLanguage = "uk";
  }

  const domainPerfProd = isPerf ? domainPerf : domainProd;

  return `https://${domainPerfProd}${betaString(beta)}-${market}${
    localLanguage ?? ""
  }.${domain}.${topLevelDomain}.com${urlPart}`;
}

async function makeAuthor(
  isTouch: boolean,
  market: string,
  beta: boolean,
  urlPart: string,
  localLanguage: string,
) {
  let wrongLink = `/content/guxeu${betaString(
    beta,
  )}/${market}/${fixLocalLanguage(localLanguage, market, true)}_${fixMarket(
    market,
  )}/${isMarketHasHomeNew(market) && !urlPart ? "home-new" : "home"}${urlPart}`;

  const matchFixSiteWide = regexFixSiteWide.exec(wrongLink);
  if (!matchFixSiteWide) {
    throw new Error("Regex not matched site wide");
  }

  const [, linkDomain, , linkContent, linkPart] = matchFixSiteWide;

  if (linkContent === "/content") {
    wrongLink = `${linkDomain}/site-wide-content${linkPart}`;
  }

  const {
    map: { originalPath },
  } = await ky
    .get(`https://${fullAuthorPath}/${pathToResolver}${wrongLink}`, {
      headers: {
        Accept: "application/json",
      },
    })
    .json<OriginalPathType>()
    .catch(() => {
      throw new Error("Please logIn to your AEM account");
    });

  return makeRealAuthorLink(originalPath, isTouch);
}

function makeRealAuthorLink(wrongLink: string, isTouch: boolean): string {
  return `https://${fullAuthorPath}/${
    isTouch ? "editor.html" : "cf#"
  }${wrongLink}.html`;
}

export async function convertLink(env: EnvTypes, url: URL): Promise<string> {
  let market = "";
  let localLanguage = "";
  let urlPart: string;
  let isAuthor = false;

  urlPart = url.pathname + url.search + url.hash;
  if (urlPart === "/") {
    urlPart = "";
  }

  const matchLive = regexLive.exec(url.href);
  if (matchLive) {
    const [, localLanguageTemp, topLevelDomain, domain] = matchLive;

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

  if (!market) {
    throw new Error(`${url} doesn't match any of the env`);
  }

  const beta = isMarketInBeta(market);

  return determineEnv(
    env,
    url.href,
    isAuthor,
    market,
    localLanguage,
    urlPart,
    beta,
  );
}
