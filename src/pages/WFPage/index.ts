import "cirrus-ui";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
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

async function addWorkflowId() {
  const sectionSelector = ".page.section > .configSection > div a";

  const getLinksInWF: NodeListOf<HTMLAnchorElement> =
    document.querySelectorAll(sectionSelector);

  const WFID = url.href.replace(await regexWorkflow(), "$4");

  const form: HTMLFormElement = await waitForElm<HTMLFormElement>(
    "#workflow-title-input",
  );

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
    const wfFixedLinks = createElement(
      "div",
      {
        className: "fixedLinksContainer",
      },
      createElement(
        "a",
        {
          href: `/cf#${path}.html`,
          target: "_blank",
          rel: "noreferrer",
        },
        path,
      ),
    );

    const root = createRoot(
      container.appendChild(document.createElement("div")),
    );
    root.render(wfFixedLinks);
  }
}

function openAllPagesFunction() {
  const links = document.querySelectorAll<HTMLAnchorElement>(
    "body > div.wrapper-conf > div > div > div > div > div.cq-element-filters > div.page.section > div > div > div > div.configValue > a",
  );
  links.forEach((link) => window.open(link.href));
}

function openAllPagesButton() {
  const buttonsContainer = document.querySelector(
    "body > div.wrapper-conf > div > div.content-conf.workflow-package-page > div.configSection > div > div:nth-child(2)",
  ) as HTMLDivElement;

  const buttonOpenAllPages = createElement(
    "button",
    {
      type: "button",
      onClick() {
        openAllPagesFunction();
      },
    },
    "OPEN ALL PAGES",
  );

  const root = createRoot(
    buttonsContainer.appendChild(document.createElement("div")),
  );
  root.render(buttonOpenAllPages);
}

async function checkNodes() {
  // Select the node that will be observed for mutations
  const targetNode = await waitForElm("div.cq-element-filters");

  const dblclickEv = new Event("dblclick");

  // Options for the observer (which mutations to observe)
  const config: MutationObserverInit = { childList: true, subtree: true };

  // Callback function to execute when mutations are observed
  const callback = (
    mutationList: MutationRecord[],
    _observer: MutationObserver,
  ) => {
    for (const mutation of mutationList) {
      if (mutation.type === "childList") {
        const childElm = mutation.target as HTMLDivElement;

        const linkElm = childElm.querySelector<HTMLAnchorElement>(
          "div > div:nth-child(1) > div.configValue > a",
        );
        if (linkElm) {
          addBetaToLink(linkElm);
        }

        const placeholderElm = childElm.querySelector("img");
        if (placeholderElm) {
          childElm.dispatchEvent(dblclickEv);
        }
      }
    }
  };

  // Create an observer instance linked to the callback function
  const observer = new MutationObserver(callback);

  // Start observing the target node for configured mutations
  observer.observe(targetNode, config);
}

(function () {
  addWorkflowId();
  usefulLinks();
  openAllPagesButton();
  checkNodes();
})();
