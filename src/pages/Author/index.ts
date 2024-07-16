import axios from "axios";
import { ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { el, mount } from "redom";
import Browser from "webextension-polyfill";
import ReferencesBanner from "../../containers/ReferencesBanner";
import WFShowTicket from "../../containers/WFShowTicket";
import {
  MessageCommon,
  ReferencesConfig,
  getFullAuthorPath,
  getLocalSavedData,
  loadSavedData,
  regexAuthor,
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

  const errorImage = el(
    "div.errorMessage",
    el("img", {
      src: "https://cataas.com/cat/gif",
    }),
    el("p", {
      textContent,
    }),
  );

  document.body.innerHTML = "";
  mount(document.body, errorImage);
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
  const refConfig: ReferencesConfig = (
    await axios.get(config, {
      headers: {
        Accept: "application/json",
      },
    })
  ).data;

  const container = document.body.insertBefore(
    document.createElement("div"),
    document.body.firstChild,
  );

  const referencesBanner: ReactElement = ReferencesBanner({
    pages: refConfig.pages,
  });

  const root = createRoot(container);
  root.render(referencesBanner);

  refGot = true;
}

Browser.runtime.onMessage.addListener(
  (
    msg: MessageCommon,
    _sender,
    _sendResponse,
  ): Promise<string | undefined> | undefined => {
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
