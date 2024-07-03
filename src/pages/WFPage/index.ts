import "cirrus-ui";
import { el, mount } from "redom";
import AEMLink, {
  regexDetermineBeta,
  regexWorkflow,
  touch,
  waitForElm,
} from "../../shared";
import "./index.scss";

const url: Location = window.location;

async function addBetaToLink(elm: HTMLAnchorElement) {
  elm.href = elm.href.replace(await regexDetermineBeta(), `$1/${touch}$2`);
}

async function addWFID() {
  const sectionSelector = ".page.section > .configSection > div a";

  const getLinksInWF: NodeListOf<HTMLAnchorElement> =
    document.querySelectorAll(sectionSelector);

  const WFID = url.href.replace(await regexWorkflow(), "$4");

  const form: HTMLFormElement = (await waitForElm(
    "#workflow-title-input",
  )) as HTMLFormElement;

  const WorkflowID = WFID;

  form.value = WorkflowID;
  getLinksInWF.forEach((link) => addBetaToLink(link));

  const requestButton: HTMLButtonElement = document.querySelector(
    "#start-request-workflow",
  ) as HTMLButtonElement;
  requestButton.removeAttribute("disabled");
}

async function usefulLinks() {
  const container = await waitForElm(
    "body > div.wrapper-conf > div > div.content-conf.workflow-package-page > div.configSection > div > div:nth-child(2)",
  );

  const data = new AEMLink();
  await data.initialize();

  data.market = data.fixMarket(
    url.href.replace(await regexWorkflow(), "$1").toLowerCase(),
  );
  data.localLanguage = url.href
    .replace(await regexWorkflow(), "$2$3")
    .toLowerCase();

  const wrongMarkets = ["da", "cs", "el"];
  const ifWrongMarket = !!wrongMarkets.some((mar) => data.market.includes(mar));

  if (ifWrongMarket) {
    [data.market, data.localLanguage] = [data.localLanguage, data.market];
  }

  data.isMarketInBeta();

  const marketPath = `/content/guxeu${data.betaString()}/${data.market}`;
  const marketLocalLangPart = `/${data.fixLocalLanguage()}_${data.fixMarket()}`;

  if (!data.betaString()) {
    addDisclosure(true);
  }

  const betaButAcc = ["es", "it"];
  if (betaButAcc.some((mar) => data.market.includes(mar))) {
    addDisclosure(true);
  } else {
    addDisclosure();
  }

  addMarketConfig();

  function addDisclosure(acc = false) {
    const disclosureLibrary = `/site-wide-content/${
      acc ? "acc-" : ""
    }disclosure-library`;

    const fullPath = marketPath + marketLocalLangPart + disclosureLibrary;
    addElem(fullPath);
  }

  function addMarketConfig() {
    const marketConfigPath = "/configuration/market-configuration";

    const fullPath = marketPath + marketConfigPath;
    addElem(fullPath);
  }

  function addElem(path: string) {
    const wfFixedLinks: HTMLDivElement = el(
      "div.fixedLinksContainer",
      el("a", {
        href: `/cf#${path}.html`,
        target: "_blank",
        rel: "noreferrer",
        textContent: path,
      }),
    ) as HTMLDivElement;
    mount(container, wfFixedLinks);
  }
}

(function Main() {
  addWFID();
  usefulLinks();
})();
