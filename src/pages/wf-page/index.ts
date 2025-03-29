import { createElement } from "react";
import { createRoot } from "react-dom/client";
import {
  betaString,
  fixLocalLanguage,
  fixMarket,
  isMarketInBeta,
} from "src/lib/convertLink";
import { getRegexDetermineBeta, getRegexWorkflow } from "src/lib/storage";
import { waitForElm } from "src/lib/tools";
import "./index.scss";

async function addBetaToLink(link: HTMLAnchorElement): Promise<void> {
  const regexDetermineBeta = await getRegexDetermineBeta();
  link.href = link.href.replace(regexDetermineBeta, `$1/${"editor.html"}$2`);
}

async function addWorkflowId(): Promise<void> {
  const sectionSelector = ".page.section > .configSection > div a";

  const getLinksInWF: NodeListOf<HTMLAnchorElement> =
    document.querySelectorAll(sectionSelector);

  const regexWorkflow = await getRegexWorkflow();
  const WFID = location.href.replace(regexWorkflow, "$4");

  const form = await waitForElm<HTMLFormElement>("#workflow-title-input");

  const WorkflowID = WFID;

  form.value = WorkflowID;
  getLinksInWF.forEach((link) => addBetaToLink(link));

  const requestButton = document.querySelector<HTMLButtonElement>(
    "#start-request-workflow",
  );
  requestButton?.removeAttribute("disabled");
}

function determineDisclosure(
  marketPath: string,
  marketLocalLangPart: string,
  acc = false,
) {
  const disclosureLibrary = `/site-wide-content/${
    acc ? "acc-" : ""
  }disclosure-library`;

  return marketPath + marketLocalLangPart + disclosureLibrary;
}

async function usefulLinks(): Promise<void> {
  const container = await waitForElm(
    "body > div.wrapper-conf > div > div.content-conf.workflow-package-page > div.configSection > div > div:nth-child(2)",
  );

  const regexWorkflow = await getRegexWorkflow();

  const matchWorkflow = regexWorkflow.exec(location.href);
  if (!matchWorkflow) {
    throw new Error("Regex not matched workflow");
  }

  const [, market, localLanguageLeft, localLanguageRight] = matchWorkflow;

  let marketFixed = fixMarket(market.toLowerCase());

  let localLanguage = `${localLanguageLeft}${localLanguageRight}`.toLowerCase();

  const wrongMarkets = ["da", "cs", "el"];
  const ifWrongMarket = !!wrongMarkets.some(
    (wrongMarket) => marketFixed === wrongMarket,
  );

  if (ifWrongMarket) {
    [marketFixed, localLanguage] = [localLanguage, marketFixed];
  }

  const beta = isMarketInBeta(marketFixed);

  const marketPath = `/content/guxeu${betaString(beta)}/${marketFixed}`;
  const marketLocalLangPart = `/${fixLocalLanguage(localLanguage, marketFixed, true)}_${marketFixed}`;

  let addDisclosure = "";
  let addAccDisclosure = "";

  if (!beta) {
    addDisclosure = determineDisclosure(marketPath, marketLocalLangPart, true);
    addAccDisclosure = determineDisclosure(marketPath, marketLocalLangPart);
  } else {
    let betaButAccBool = false;

    const betaButAcc = ["es", "it"];
    if (betaButAcc.some((mar) => marketFixed?.includes(mar))) {
      betaButAccBool = true;
    }

    addDisclosure = determineDisclosure(
      marketPath,
      marketLocalLangPart,
      betaButAccBool,
    );
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

  const rootElm = document.createElement("span");
  rootElm.style.width = "100%";

  const root = createRoot(container.appendChild(rootElm));
  root.render(wfFixedLinks);
}

function openAllPages(): void {
  const links = document.querySelectorAll<HTMLAnchorElement>(
    "body > div.wrapper-conf div.configSubSection div.page.section div.configValue > a",
  );
  links.forEach(({ href }) => window.open(href));
}

function openAllPagesButton(): void {
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
        openAllPages();
      },
    },
    "OPEN ALL PAGES",
  );

  const root = createRoot(
    buttonsContainer.appendChild(document.createElement("span")),
  );
  root.render(buttonOpenAllPages);
}

async function checkNodes(): Promise<void> {
  // Select the node that will be observed for mutations
  const targetNode = await waitForElm("div.cq-element-filters");

  const dblclickEv = new Event("dblclick");

  // Options for the observer (which mutations to observe)
  const config: MutationObserverInit = { childList: true, subtree: true };

  // Callback function to execute when mutations are observed
  const callback: MutationCallback = (mutationList: MutationRecord[]) => {
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

// Main logic

addWorkflowId();
usefulLinks();
openAllPagesButton();
checkNodes();
