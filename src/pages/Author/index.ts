import axios from "axios";
import { ReactElement } from "react";
import { createRoot } from "react-dom/client";
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

async function getRealPerfUrl(): Promise<string | undefined> {
  return (await waitForElm<HTMLMetaElement>("head > meta[name='og:url']"))
    ?.content;
}

async function catErrors() {
  const savedData = await loadSavedData();
  if (!savedData.enableFunErr) {
    return;
  }

  let errorText = document.querySelector("body > header > title");
  const errorImage =
    '<img style="display: block;-webkit-user-select: none; display: block; margin-left: auto; margin-right: auto; width: 50%;" src="https://cataas.com/cat/gif">';
  const errorStyle = 'style="text-align: center; color: red; font-size: 50px;"';
  if (errorText?.textContent === "AEM Permissions Required") {
    document.body.innerHTML = "";
    document.body.insertAdjacentHTML(
      "afterbegin",
      errorImage + `<p ${errorStyle}>404 ERROR - Not Found</p>`,
    );
    return;
  }

  errorText = document.querySelector("body > h1");
  if (errorText) {
    if (errorText.textContent === "Forbidden") {
      document.body.innerHTML = "";
      document.body.insertAdjacentHTML(
        "afterbegin",
        errorImage + `<p ${errorStyle}>403 ERROR - Forbidden</p>`,
      );
      return;
    }
    if (errorText.textContent === "Bad Gateway") {
      document.body.innerHTML = "";
      document.body.insertAdjacentHTML(
        "afterbegin",
        errorImage + `<p ${errorStyle}>503 ERROR - Bad Gateway</p>`,
      );
      return;
    }
  }
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
  const root = createRoot(container);

  const referencesBanner: ReactElement = ReferencesBanner({
    pages: refConfig.pages,
  });
  root.render(referencesBanner);

  refGot = true;
}

Browser.runtime.onMessage.addListener(
  async (
    msg: MessageCommon,
    _sender,
    _sendResponse,
  ): Promise<string | undefined> => {
    if (msg.from === "popup" && msg.subject === "checkReferences") {
      checkReferences();
    }

    if (msg.from === "background" && msg.subject === "getRealUrl") {
      return Promise.resolve(await getRealPerfUrl());
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
