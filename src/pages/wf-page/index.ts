import { createElement } from "react";
import { createRoot } from "react-dom/client";
import AEMLink, {
  regexDetermineBeta,
  regexWorkflow,
  touch,
  waitForElm,
} from "../../shared";
import "./index.scss";

const addBetaToLink = async ({ href }: HTMLAnchorElement) =>
  (href = href.replace(await regexDetermineBeta(), `$1/${touch}$2`));

async function addWorkflowId() {
  const sectionSelector = ".page.section > .configSection > div a";

  const getLinksInWF: NodeListOf<HTMLAnchorElement> =
    document.querySelectorAll(sectionSelector);

  const WFID = location.href.replace(await regexWorkflow(), "$4");

  const form = await waitForElm<HTMLFormElement>("#workflow-title-input");

  const WorkflowID = WFID;

  form.value = WorkflowID;
  getLinksInWF.forEach((link) => addBetaToLink(link));

  const requestButton = document.querySelector<HTMLButtonElement>(
    "#start-request-workflow",
  );
  requestButton?.removeAttribute("disabled");
}

async function usefulLinks() {
  const container = await waitForElm(
    "body > div.wrapper-conf > div > div.content-conf.workflow-package-page > div.configSection > div > div:nth-child(2)",
  );

  const AEMInstance = new AEMLink();
  await AEMInstance.initialize();

  AEMInstance.market = AEMInstance.fixMarket(
    location.href.replace(await regexWorkflow(), "$1").toLowerCase(),
  );
  AEMInstance.localLanguage = location.href
    .replace(await regexWorkflow(), "$2$3")
    .toLowerCase();

  const wrongMarkets = ["da", "cs", "el"];
  const ifWrongMarket = !!wrongMarkets.some((mar) =>
    AEMInstance.market?.includes(mar),
  );

  if (ifWrongMarket) {
    [AEMInstance.market, AEMInstance.localLanguage] = [
      AEMInstance.localLanguage,
      AEMInstance.market,
    ];
  }

  AEMInstance.isMarketInBeta();

  const marketPath = `/content/guxeu${AEMInstance.betaString()}/${AEMInstance.market}`;
  const marketLocalLangPart = `/${AEMInstance.fixLocalLanguage()}_${AEMInstance.fixMarket()}`;

  function determineDisclosure(acc = false) {
    const disclosureLibrary = `/site-wide-content/${
      acc ? "acc-" : ""
    }disclosure-library`;

    return marketPath + marketLocalLangPart + disclosureLibrary;
  }

  let addDisclosure: string | null = null;
  let addAccDisclosure: string | null = null;

  if (!AEMInstance.beta) {
    addDisclosure = determineDisclosure(true);
    addAccDisclosure = determineDisclosure(false);
  } else {
    let betaButAccBool = false;

    const betaButAcc = ["es", "it"];
    if (betaButAcc.some((mar) => AEMInstance.market?.includes(mar))) {
      betaButAccBool = true;
    }

    addDisclosure = determineDisclosure(betaButAccBool);
  }

  let addMarketConfig: string | null = null;

  const marketConfigPart = "/configuration/market-configuration";
  addMarketConfig = marketPath + marketConfigPart;

  const wfFixedLinks = createElement(
    "div",
    {
      className: "fixedLinksContainer",
    },

    addDisclosure &&
      createElement(
        "a",
        {
          href: `/cf#${addDisclosure}.html`,
          target: "_blank",
          rel: "noreferrer",
        },
        addDisclosure,
      ),

    addAccDisclosure &&
      createElement(
        "a",
        {
          href: `/cf#${addAccDisclosure}.html`,
          target: "_blank",
          rel: "noreferrer",
        },
        addAccDisclosure,
      ),

    addMarketConfig &&
      createElement(
        "a",
        {
          href: `/cf#${addMarketConfig}.html`,
          target: "_blank",
          rel: "noreferrer",
        },
        addMarketConfig,
      ),
  );

  const root = createRoot(
    container.appendChild(document.createElement("span")),
  );
  root.render(wfFixedLinks);
}

function openAllPagesFunction() {
  const links = document.querySelectorAll<HTMLAnchorElement>(
    "body > div.wrapper-conf > div > div > div > div > div.cq-element-filters > div.page.section > div > div > div > div.configValue > a",
  );
  links.forEach(({ href }) => window.open(href));
}

function openAllPagesButton() {
  const buttonsContainer = document.querySelector<HTMLDivElement>(
    "body > div.wrapper-conf > div > div.content-conf.workflow-package-page > div.configSection > div > div:nth-child(2)",
  );
  if (!buttonsContainer) {
    throw new Error("button container wasn't found");
  }

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
    buttonsContainer.appendChild(document.createElement("span")),
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
  const callback: MutationCallback = (
    mutationList: MutationRecord[],
    _observer: MutationObserver,
  ) => {
    for (const { type, target } of mutationList) {
      if (type === "childList") {
        const childElm = target as HTMLDivElement;

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
