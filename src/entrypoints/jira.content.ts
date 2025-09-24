import { WFCreateButton } from "$lib/content";
import { onMessage } from "$lib/messaging";
import {
  fullAuthorPath,
  jiraMatch,
  loadSavedData,
  regexWFTitle,
  secretWord,
  workflowPath,
  type SavedLocalData,
} from "$lib/storage";
import { mount } from "svelte";

const marketMap: Record<string, string> = {
  [`${secretWord} Germany`]: "DEDE",
  [`${secretWord} Britain`]: "ENGB",
  [`${secretWord} Spain`]: "ESES",
  [`${secretWord} France`]: "FRFR",
  [`${secretWord} Italy`]: "ITIT",
  [`${secretWord} Netherlands`]: "NLNL",
  [`${secretWord} Ireland`]: "IEIE",
  [`${secretWord} Denmark`]: "DA_DK",
  [`${secretWord} Portugal`]: "PTPT",
  [`${secretWord} Norway`]: "NONO",
  [`${secretWord} Finland`]: "FIFI",
  [`${secretWord} Poland`]: "PLPL",
  [`${secretWord} Austria`]: "ATDE",
  [`${secretWord} Czech Republic`]: "CSCZ",
  [`${secretWord} Hungary`]: "HUHU",
  [`${secretWord} Greece`]: "ELGR",
  [`${secretWord} Romania`]: "RORO",
  [`${secretWord} Luxembourg`]: "LULU",
};

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

const getMarketWFPath = (market: string): string | undefined =>
  marketMap[market];

function textToWFPath(
  market: string,
  localLanguage: string,
  title: string,
): string | undefined {
  if (market === `${secretWord} Belgium`) {
    return belgium(localLanguage, title);
  }
  if (market === `${secretWord} Switzerland`) {
    return switzerland(localLanguage, title);
  }

  const mapped = getMarketWFPath(market);
  if (mapped) {
    return mapped;
  }

  return wfPathFromTitle(title);
}

function ticketNumber(ticketNumElm: HTMLElement): string {
  const ticketNum: string | undefined = ticketNumElm
    .getAttribute("data-issue-key")
    ?.match(/ESM-\w+/gm)?.[0];

  const labels: NodeListOf<HTMLSpanElement> = document.querySelectorAll(
    "#wrap-labels > div > ul > li > a > span",
  );

  const embargo = Array.from(labels).some(({ textContent: labelText }) =>
    labelText?.includes("embargo"),
  )
    ? "-EMBARGO"
    : "";

  const ticketStatus = document.querySelector<HTMLElement>(
    "#opsbar-transitions_more > span",
  );

  const fix = ticketStatus?.textContent?.includes("deployment") ? "-FIX" : "";

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
  const wfTitle = selectorTextNoSpaces("#summary-val");
  // const workType = selectorTextNoSpaces("#customfield_18667-val");
  // TODO: implement analytics WF

  if (!ticketMarket || !ticketLocalLanguage || !wfTitle) {
    throw new Error(
      `ticketMarket = ${ticketMarket} or ticketLocalLanguage = ${ticketLocalLanguage} or WFTitle = ${wfTitle} is undefined`,
    );
  }

  browser.storage.local.set<SavedLocalData>({
    wfName: ticketNumber(ticketNumElm),
    wfTitle,
  });

  const WFPath = textToWFPath(ticketMarket, ticketLocalLanguage, wfTitle);
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
  matches: jiraMatch,
  runAt: "document_end",
  async main() {
    onMessage("createWF", aemToolsCreateWF);
    onMessage("getEnvironment", () => "jira");

    const { disCreateWf, enableFilterFix } = await loadSavedData();

    if (!disCreateWf) {
      createWFButton();
    }

    if (enableFilterFix) {
      fixSorting();
    }
  },
});
