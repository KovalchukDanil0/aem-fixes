import axios from "axios";
import { createElement, ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { ReferencesBanner, WFShowTicket } from "src/components";
import {
  getFullAuthorPath,
  getLocalSavedData,
  getRegexAuthor,
  getRegexDetermineBeta,
  loadSavedData,
} from "src/lib/storage";
import { waitForElm } from "src/lib/tools";
import { MessageCommon, ReferencesConfig } from "src/lib/types";
import { runtime } from "webextension-polyfill";
import "./index.scss";

const url =
  window.location !== window.parent.location
    ? window.parent.location.href
    : window.location.href;

async function getPathToReferences(): Promise<string> {
  const {
    secretSettings: { pathToReferences },
  } = await getLocalSavedData();
  return pathToReferences;
}

async function getPathToReferencesParams(): Promise<string> {
  const {
    secretSettings: { pathToReferencesParams },
  } = await getLocalSavedData();
  return pathToReferencesParams;
}

async function getJiraFullPath(): Promise<string> {
  const {
    secretSettings: { jiraFullPath },
  } = await getLocalSavedData();
  return jiraFullPath;
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

async function ticketFinder(): Promise<void> {
  const blockingTicketElm = await waitForElm<HTMLElement>(
    "div.workflows-warning-bar > i:nth-child(3)",
  );
  const root = createRoot(blockingTicketElm);

  const blockingTicket: string | null = blockingTicketElm.textContent;
  const jiraPath = await getJiraFullPath();

  const wfShowTicket: ReactElement = WFShowTicket({ blockingTicket, jiraPath });
  root.render(wfShowTicket);
}

let refGot = false;
async function checkReferences(): Promise<void> {
  if (refGot) {
    return;
  }

  const fullAuthorPath = await getFullAuthorPath();
  const regexAuthor = await getRegexAuthor();

  const encodedURL = encodeURIComponent(url.replace(regexAuthor, "$3"));
  const pathToReferences = await getPathToReferences();
  const pathToReferencesParams = await getPathToReferencesParams();

  const config = `https://${fullAuthorPath}/${pathToReferences}${encodedURL}${pathToReferencesParams}`;
  const {
    data: { pages },
  } = await axios
    .get<ReferencesConfig>(config, {
      headers: {
        Accept: "application/json",
      },
    })
    .catch(({ message }: Error) => {
      throw new Error(`cannot reach ref config page - ${message}`);
    });

  const container = document.body.insertBefore(
    document.createElement("span"),
    document.body.firstChild,
  );

  const regexDetermineBeta = await getRegexDetermineBeta();
  const referencesBanner: ReactElement = ReferencesBanner({
    pages,
    regexDetermineBeta,
  });

  const root = createRoot(container);
  root.render(referencesBanner);

  refGot = true;
}

runtime.onMessage.addListener(
  // @ts-expect-error types issue
  ({ from, subject }: MessageCommon): Promise<string | undefined> => {
    if (from === "popup" && subject === "checkReferences") {
      checkReferences();
    }

    if (from === "background" && subject === "getRealUrl") {
      return Promise.resolve(getRealPerfUrl());
    }

    return Promise.resolve(undefined);
  },
);

// Main logic

const { enableFunErr } = await loadSavedData();

if (enableFunErr) {
  catErrors();
}

ticketFinder();
