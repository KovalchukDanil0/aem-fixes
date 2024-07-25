import axios from "axios";
import { createElement, ReactElement } from "react";
import { createRoot } from "react-dom/client";
import Browser from "webextension-polyfill";
import ReferencesBanner from "../../containers/ReferencesBanner";
import WFShowTicket from "../../containers/WFShowTicket";
import {
  getFullAuthorPath,
  getLocalSavedData,
  loadSavedData,
  MessageCommon,
  ReferencesConfig,
  regexAuthor,
  regexDetermineBeta,
  waitForElm,
} from "../../shared";
import "./index.scss";

const url =
  window.location !== window.parent.location
    ? window.parent.location.href
    : window.location.href;

async function getPathToReferences(): Promise<string> {
  const data = await getLocalSavedData();
  return data.secretSettings.pathToReferences;
}

async function getPathToReferencesParams(): Promise<string> {
  const data = await getLocalSavedData();
  return data.secretSettings.pathToReferencesParams;
}

async function getJiraFullPath(): Promise<string> {
  const data = await getLocalSavedData();
  return data.secretSettings.jiraFullPath;
}

function getRealPerfUrl(): string | undefined {
  return document.querySelector<HTMLMetaElement>("head > meta[name='og:url']")
    ?.content;
}

async function catErrors() {
  let textContent = document.querySelector(
    "body > header > title",
  )?.textContent;
  switch (textContent) {
    case "AEM Permissions Required":
      textContent = "404 ERROR - Not Found";
      break;
    case "Forbidden":
      textContent = "403 ERROR - Forbidden";
      break;
    case "Bad Gateway":
      textContent = "503 ERROR - Bad Gateway";
      break;
    default:
      return;
  }

  const errorImage = createElement(
    "div",
    {
      className: "errorMessage",
    },
    createElement("img", { src: "https://cataas.com/cat/gif" }),
    createElement("p", {}, textContent),
  );

  const root = createRoot(document.body);
  root.render(errorImage);
}

async function ticketFinder() {
  const blockingTicketElm: HTMLElement = await waitForElm(
    "div.workflows-warning-bar > i:nth-child(3)",
  );
  const root = createRoot(blockingTicketElm);

  const blockingTicket: string | null = blockingTicketElm.textContent;
  const jiraPath = await getJiraFullPath();

  const wfShowTicket: ReactElement = WFShowTicket({ blockingTicket, jiraPath });
  root.render(wfShowTicket);
}

let refGot = false;
async function checkReferences() {
  if (refGot) {
    return;
  }

  const fullAuthorPath = await getFullAuthorPath();
  const encodedURL = encodeURIComponent(url.replace(await regexAuthor(), "$3"));
  const pathToReferences = await getPathToReferences();
  const pathToReferencesParams = await getPathToReferencesParams();

  const config = `https://${fullAuthorPath}/${pathToReferences}${encodedURL}${pathToReferencesParams}`;
  const refConfig = (
    await axios
      .get<ReferencesConfig>(config, {
        headers: {
          Accept: "application/json",
        },
      })
      .catch(() => null)
  )?.data;
  if (!refConfig) {
    throw new Error("cannot reach ref config page");
  }

  const container = document.body.insertBefore(
    document.createElement("div"),
    document.body.firstChild,
  );

  const referencesBanner: ReactElement = ReferencesBanner({
    pages: refConfig.pages,
    regexDetermineBeta: await regexDetermineBeta(),
  });

  const root = createRoot(container);
  root.render(referencesBanner);

  refGot = true;
}

Browser.runtime.onMessage.addListener(
  (msg: MessageCommon, _sender, _sendResponse): Promise<string> | undefined => {
    if (msg.from === "popup" && msg.subject === "checkReferences") {
      checkReferences();
    }

    if (msg.from === "background" && msg.subject === "getRealUrl") {
      const realPerfLink = getRealPerfUrl();
      if (realPerfLink) {
        return Promise.resolve(realPerfLink);
      }
    }
  },
);

(async function Main() {
  const savedData = await loadSavedData();

  if (savedData.enableFunErr) {
    catErrors();
  }

  ticketFinder();
})();
