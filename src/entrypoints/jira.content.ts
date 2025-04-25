import { WFCreateButton } from "$components/content";
import {
  fullAuthorPath,
  loadSavedData,
  regexWFTitle,
  secretWord,
  workflowPath,
} from "$lib/storage";
import { mount } from "svelte";

function createWFButton() {
  const buttonsContainer = document.querySelector<HTMLDivElement>(
    "#stalker >* div.aui-toolbar2-primary",
  );

  if (!buttonsContainer) {
    throw new Error("buttonsContainer is undefined");
  }

  mount(WFCreateButton, {
    target: buttonsContainer,
    props: { createWF: aemToolsCreateWF },
  });
}

function selectorTextNoSpaces(selector: string): string | undefined {
  return document.querySelector(selector)?.textContent?.trim();
}

function belgium(localLanguage: string, title: string): string | undefined {
  let fullPath: string | undefined = "BE";

  switch (localLanguage) {
    case "Dutch":
      fullPath += `/${fullPath}NL`;
      break;
    case "French":
      fullPath += `/${fullPath}FR`;
      break;
    default:
      fullPath = wfPathFromTitle(title);
      break;
  }

  return fullPath;
}

function switzerland(localLanguage: string, title: string): string | undefined {
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
      fullPath = wfPathFromTitle(title);
      break;
  }

  return fullPath;
}

function wfPathFromTitle(title: string): string | undefined {
  const matchWFTitle = regexWFTitle.exec(title);
  if (!matchWFTitle) {
    throw new Error("Regex not matched WF Title");
  }

  const [, market, localLanguage] = matchWFTitle;

  const pathFromTitle = localLanguage
    ? `${market}/${market}${localLanguage}`
    : market + market;

  const wfPath = prompt(
    "Market was not determined, can we take path from title?",
    pathFromTitle,
  );
  if (!wfPath) {
    return;
  }

  return wfPath;
}

function textToWFPath(
  market: string,
  localLanguage: string,
  title: string,
): string | undefined {
  let fullPath: string | undefined;

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
      fullPath = belgium(localLanguage, title);
      break;
    case `${secretWord} Hungary`:
      fullPath = "HUHU";
      break;
    case `${secretWord} Greece`:
      fullPath = "ELGR";
      break;
    case `${secretWord} Switzerland`:
      fullPath = switzerland(localLanguage, title);
      break;
    case `${secretWord} Romania`:
      fullPath = "RORO";
      break;
    case `${secretWord} Luxembourg`:
      fullPath = "LULU";
      break;
    default:
      fullPath = wfPathFromTitle(title);
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

function aemToolsCreateWF() {
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

  browser.storage.local.set<SavedLocalData>({
    WFName: ticketNumber(ticketNumElm),
    WFTitle,
  });

  const WFPath = textToWFPath(ticketMarket, ticketLocalLanguage, WFTitle);
  if (!WFPath) {
    return;
  }

  window.open(`https://${fullAuthorPath}/${workflowPath}/${WFPath}`);
}

function fixSorting() {
  const sortByDate = document.querySelector<HTMLAnchorElement>(
    '#attachment-sorting-options > li:nth-child(2) > a:not([class*="aui-checked"])',
  );
  sortByDate?.click();

  const descending = document.querySelector<HTMLAnchorElement>(
    '#attachment-sorting-order-options > li:nth-child(2) > a:not([class*="aui-checked"])',
  );
  descending?.click();
}

export default defineContentScript({
  matches: [import.meta.env.VITE_JIRA_MATCH],
  runAt: "document_end",
  async main() {
    browser.runtime.onMessage.addListener(
      ({ from, subject }: MessageCommon, _, sendResponse) => {
        if (from !== "popup") {
          return;
        }

        if (subject === "createWF") {
          aemToolsCreateWF();
        }

        if (subject === "getEnvironment") {
          sendResponse("jira" as EnvTypesExtended);
        }
      },
    );

    const { disCreateWF, enableFilterFix } = await loadSavedData();

    if (!disCreateWF) {
      createWFButton();
    }

    if (enableFilterFix) {
      fixSorting();
    }
  },
});
