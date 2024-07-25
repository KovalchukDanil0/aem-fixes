import { createElement } from "react";
import { createRoot } from "react-dom/client";
import Browser from "webextension-polyfill";
import {
  MessageCommon,
  getFullAuthorPath,
  getLocalSavedData,
  getWorkflowPath,
  loadSavedData,
  regexWFTitle,
} from "../../shared";

async function getSecretWord(): Promise<string> {
  const data = await getLocalSavedData();
  return data.secretSettings.secretWord;
}

function createWFButton() {
  const buttonsContainer: HTMLDivElement | null = document.querySelector(
    "#stalker >* div.aui-toolbar2-primary",
  );

  if (!buttonsContainer) {
    throw new Error("buttonsContainer is undefined");
  }

  const butCreateWF = createElement(
    "a",
    {
      className: "aui-button",
      role: "button",
      title: "Create WF",
      resolved: null,
      onClick() {
        aemToolsCreateWF();
      },
    },
    "Create WF",
  );

  const root = createRoot(
    buttonsContainer.appendChild(document.createElement("p")),
  );
  root.render(butCreateWF);
}

function selectorTextNoSpaces(selector: string): string | undefined {
  try {
    return document.querySelector(selector)?.textContent?.trim();
  } catch (err) {
    throw new Error(
      `element with selector "${selector}" was not found\nfull error - ${err}`,
    );
  }
}

async function textToWFPath(
  market: string | undefined,
  localLanguage: string | undefined,
  title: string | undefined,
): Promise<string> {
  let fullPath = "";

  function belgium() {
    switch (localLanguage) {
      case "Dutch":
        fullPath += `/${fullPath}NL`;
        break;
      case "French":
        fullPath += `/${fullPath}FR`;
        break;
      default:
        wfPathFromTitle();
        break;
    }
  }

  function switzerland() {
    switch (localLanguage) {
      case "German":
        fullPath += `/${fullPath}DE`;
        break;
      case "French":
        fullPath += `/${fullPath}FR`;
        break;
      case "Italian":
        fullPath += `/${fullPath}IT`;
        break;
      default:
        wfPathFromTitle();
        break;
    }
  }

  const secretWord = await getSecretWord();

  switch (market) {
    case `${secretWord} Germany`:
      fullPath = "DEDE";
      break;
    case `${secretWord} Britain`:
      fullPath = "ENGB";
      break;
    case `${secretWord} Spain`:
      fullPath = "ESES";
      break;
    case `${secretWord} France`:
      fullPath = "FRFR";
      break;
    case `${secretWord} Italy`:
      fullPath = "ITIT";
      break;
    case `${secretWord} Netherlands`:
      fullPath = "NLNL";
      break;
    case `${secretWord} Ireland`:
      fullPath = "IEIE";
      break;
    case `${secretWord} Denmark`:
      fullPath = "DA_DK";
      break;
    case `${secretWord} Portugal`:
      fullPath = "PTPT";
      break;
    case `${secretWord} Norway`:
      fullPath = "NONO";
      break;
    case `${secretWord} Finland`:
      fullPath = "FIFI";
      break;
    case `${secretWord} Poland`:
      fullPath = "PLPL";
      break;
    case `${secretWord} Austria`:
      fullPath = "ATDE";
      break;
    case `${secretWord} Czech Republic`:
      fullPath = "CSCZ";
      break;
    case `${secretWord} Belgium`:
      fullPath = "BE";
      belgium();
      break;
    case `${secretWord} Hungary`:
      fullPath = "HUHU";
      break;
    case `${secretWord} Greece`:
      fullPath = "ELGR";
      break;
    case `${secretWord} Switzerland`:
      fullPath = "CH";
      switzerland();
      break;
    case `${secretWord} Romania`:
      fullPath = "RORO";
      break;
    case `${secretWord} Luxembourg`:
      fullPath = "LULU";
      break;
    default:
      wfPathFromTitle();
      break;
  }

  async function wfPathFromTitle() {
    // eslint-disable-next-line no-restricted-globals
    const response = confirm(
      "Market was not determined, can we take path from title?",
    );
    if (!response) {
      return;
    }

    const regexWFTitleCached = await regexWFTitle();

    market = title?.replace(regexWFTitleCached, "$1");
    if (!market) {
      throw new Error("market from title is undefined");
    }

    localLanguage = title?.replace(regexWFTitleCached, "$2");

    if (!localLanguage) {
      fullPath = market + market;
    } else {
      fullPath = `${market}/${market}${localLanguage}`;
    }
  }

  return fullPath;
}

function ticketNumber(ticketNumElm: HTMLElement): string {
  const ticketNum: string | undefined = ticketNumElm
    .getAttribute("data-issue-key")
    ?.match(/ESM-\w+/gm)?.[0];

  let embargo = "";

  const labels: NodeListOf<HTMLSpanElement> = document.querySelectorAll(
    "#wrap-labels > div > ul > li > a > span",
  );
  labels.forEach((label: HTMLSpanElement) => {
    if (label.textContent?.includes("embargo")) {
      embargo = "-EMBARGO";
    }
  });

  let fix = "";
  const ticketStatus: string | null = (
    document.querySelector("#opsbar-transitions_more > span") as HTMLSpanElement
  ).textContent;
  if (ticketStatus?.includes("deployment")) {
    fix = "-FIX";
  }

  return ticketNum + embargo + fix;
}

async function aemToolsCreateWF() {
  const ticketNumElm: HTMLElement = document.querySelector(
    "#parent_issue_summary",
  ) as HTMLElement;
  if (!ticketNumElm) {
    throw new Error("This is not children ticket page");
  }

  const ticketMarket: string | undefined = selectorTextNoSpaces(
    "#customfield_13300-val",
  );
  const ticketLocalLanguage: string | undefined = selectorTextNoSpaces(
    "#customfield_15000-val",
  );
  const ticketTitle: string | undefined = selectorTextNoSpaces("#summary-val");

  Browser.storage.local.set({
    WFTitle: ticketTitle,
    WFName: ticketNumber(ticketNumElm),
  });

  const WFPath: string = await textToWFPath(
    ticketMarket,
    ticketLocalLanguage,
    ticketTitle,
  );

  const fullAuthorPath = await getFullAuthorPath();
  const workflowPath = await getWorkflowPath();

  window.open(`https://${fullAuthorPath}/${workflowPath}/${WFPath}`);
}

function fixSorting() {
  const sortByDate: HTMLAnchorElement | null = document.querySelector(
    '#attachment-sorting-options > li:nth-child(2) > a:not([class*="aui-checked"])',
  );
  sortByDate?.click();

  const descending: HTMLAnchorElement | null = document.querySelector(
    '#attachment-sorting-order-options > li:nth-child(2) > a:not([class*="aui-checked"])',
  );
  descending?.click();
}

Browser.runtime.onMessage.addListener(
  (msg: MessageCommon, _sender, _sendResponse) => {
    if (msg.from === "popup" && msg.subject === "createWF") {
      aemToolsCreateWF();
    }
  },
);

(async function Main() {
  const savedData = await loadSavedData();

  if (!savedData.disCreateWF) {
    createWFButton();
  }

  if (savedData.enableFilterFix) {
    fixSorting();
  }
})();
