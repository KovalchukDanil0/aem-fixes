import { createElement } from "react";
import { createRoot } from "react-dom/client";
import {
  getFullAuthorPath,
  getLocalSavedData,
  getRegexWFTitle,
  getWorkflowPath,
  loadSavedData,
} from "src/lib/storage";
import { MessageCommon } from "src/lib/types";
import { runtime, storage } from "webextension-polyfill";

async function getSecretWord(): Promise<string> {
  const {
    secretSettings: { secretWord },
  } = await getLocalSavedData();
  return secretWord;
}

function createWFButton(): void {
  const buttonsContainer = document.querySelector<HTMLDivElement>(
    "#stalker >* div.aui-toolbar2-primary",
  );

  if (!buttonsContainer) {
    throw new Error("buttonsContainer is undefined");
  }

  const rootDiv = document.createElement("span");
  rootDiv.classList.add("aui-buttons");

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

  const root = createRoot(buttonsContainer.appendChild(rootDiv));
  root.render(butCreateWF);
}

function selectorTextNoSpaces(selector: string): string | undefined {
  return document.querySelector(selector)?.textContent?.trim();
}

async function belgium(
  localLanguage: string,
  title: string,
): Promise<string | undefined> {
  let fullPath: string | undefined = "BE";

  switch (localLanguage) {
    case "Dutch":
      fullPath += `/${fullPath}NL`;
      break;
    case "French":
      fullPath += `/${fullPath}FR`;
      break;
    default:
      fullPath = await wfPathFromTitle(title);
      break;
  }

  return fullPath;
}

async function switzerland(
  localLanguage: string,
  title: string,
): Promise<string | undefined> {
  let fullPath: string | undefined = "CH";

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
      fullPath = await wfPathFromTitle(title);
      break;
  }

  return fullPath;
}

async function wfPathFromTitle(title: string): Promise<string | undefined> {
  const response = confirm(
    "Market was not determined, can we take path from title?",
  );
  if (!response) {
    return;
  }

  const regexWFTitleCached = await getRegexWFTitle();

  const market = title?.replace(regexWFTitleCached, "$1");
  if (!market) {
    throw new Error("market from title is undefined");
  }

  const localLanguage = title?.replace(regexWFTitleCached, "$2");

  let fullPath: string;
  if (!localLanguage) {
    fullPath = market + market;
  } else {
    fullPath = `${market}/${market}${localLanguage}`;
  }

  return fullPath;
}

async function textToWFPath(
  market: string,
  localLanguage: string,
  title: string,
): Promise<string | undefined> {
  let fullPath: string | undefined;

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
      fullPath = await belgium(localLanguage, title);
      break;
    case `${secretWord} Hungary`:
      fullPath = "HUHU";
      break;
    case `${secretWord} Greece`:
      fullPath = "ELGR";
      break;
    case `${secretWord} Switzerland`:
      fullPath = await switzerland(localLanguage, title);
      break;
    case `${secretWord} Romania`:
      fullPath = "RORO";
      break;
    case `${secretWord} Luxembourg`:
      fullPath = "LULU";
      break;
    default:
      wfPathFromTitle(title);
      break;
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
  labels.forEach(({ textContent: labelText }: HTMLSpanElement) => {
    if (labelText?.includes("embargo")) {
      embargo = "-EMBARGO";
    }
  });

  let fix = "";
  const ticketStatus = document.querySelector<HTMLElement>(
    "#opsbar-transitions_more > span",
  );
  if (ticketStatus?.textContent?.includes("deployment")) {
    fix = "-FIX";
  }

  return ticketNum + embargo + fix;
}

async function aemToolsCreateWF() {
  const ticketNumElm = document.querySelector<HTMLElement>(
    "#parent_issue_summary",
  );
  if (!ticketNumElm?.textContent) {
    throw new Error("This is not children ticket page");
  }

  const ticketMarket = selectorTextNoSpaces("#customfield_13300-val");
  const ticketLocalLanguage = selectorTextNoSpaces("#customfield_15000-val");
  const WFTitle = selectorTextNoSpaces("#summary-val");

  if (!ticketMarket || !ticketLocalLanguage || !WFTitle) {
    throw new Error(
      `ticketMarket = ${ticketMarket} or ticketLocalLanguage = ${ticketLocalLanguage} or WFTitle = ${WFTitle} is undefined`,
    );
  }

  storage.local.set({
    WFTitle,
    WFName: ticketNumber(ticketNumElm),
  });

  const WFPath = await textToWFPath(ticketMarket, ticketLocalLanguage, WFTitle);

  const fullAuthorPath = await getFullAuthorPath();
  const workflowPath = await getWorkflowPath();

  window.open(`https://${fullAuthorPath}/${workflowPath}/${WFPath}`);
}

function fixSorting(): void {
  const sortByDate = document.querySelector<HTMLAnchorElement>(
    '#attachment-sorting-options > li:nth-child(2) > a:not([class*="aui-checked"])',
  );
  sortByDate?.click();

  const descending = document.querySelector<HTMLAnchorElement>(
    '#attachment-sorting-order-options > li:nth-child(2) > a:not([class*="aui-checked"])',
  );
  descending?.click();
}

runtime.onMessage.addListener(({ from, subject }: MessageCommon): void => {
  if (from === "popup" && subject === "createWF") {
    aemToolsCreateWF();
  }
});

(async function () {
  const { disCreateWF, enableFilterFix } = await loadSavedData();

  if (!disCreateWF) {
    createWFButton();
  }

  if (enableFilterFix) {
    fixSorting();
  }
})();
