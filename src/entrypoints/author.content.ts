import { ErrorMessage, ReferencesBanner, WFShowTicket } from "$lib/content";
import { onMessage } from "$lib/messaging";
import {
  authorMatch,
  fullAuthorPath,
  isTouch,
  loadSavedData,
  pathToReferences,
  pathToReferencesParams,
  regexAuthor,
} from "$lib/storage";
import { waitForElm } from "$lib/tools";
import ky from "ky";
import { mount } from "svelte";

const url =
  window.location !== window.parent.location
    ? window.parent.location.href
    : window.location.href;

const getRealPerfUrl = () =>
  document.querySelector<HTMLMetaElement>("head > meta[name='og:url']")
    ?.content;

function catErrors() {
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

  mount(ErrorMessage, {
    target: document.body,
    props: { text: textContent },
  });
}

async function ticketFinder() {
  const blockingTicketElm = await waitForElm<HTMLElement>(
    "div.workflows-warning-bar > i:nth-child(3)",
  );

  const blockingTicket = blockingTicketElm.textContent;
  if (!blockingTicket) {
    return;
  }

  blockingTicketElm.textContent = "";
  mount(WFShowTicket, { target: blockingTicketElm, props: { blockingTicket } });
}

let refGot = false;
async function checkReferences() {
  if (refGot) {
    return;
  }

  const encodedURL = encodeURIComponent(url.replace(regexAuthor, "$3"));

  const config = `https://${fullAuthorPath}/${pathToReferences}${encodedURL}${pathToReferencesParams}`;
  const { pages } = await ky
    .get(config, {
      headers: {
        Accept: "application/json",
      },
    })
    .json<ReferencesConfig>()
    .catch(({ message }: Error) => {
      throw new Error(`cannot reach ref config page - ${message}`);
    });

  const container = document.body.insertBefore(
    document.createElement("span"),
    document.body.firstChild,
  );

  mount(ReferencesBanner, { target: container, props: { pages } });

  refGot = true;
}

export default defineContentScript({
  matches: authorMatch,
  allFrames: true,
  runAt: "document_end",
  async main() {
    const inIframe = window.self !== window.top;

    if (inIframe) {
      onMessage("getRealUrl", getRealPerfUrl);

      onMessage("getEnvironment", () => (isTouch(url) ? "editor.html" : "cf#"));
      onMessage("checkReferences", checkReferences);
    }

    if (!inIframe) {
      return;
    }

    const { enableFunErr } = await loadSavedData();

    if (enableFunErr) {
      catErrors();
    }

    ticketFinder();
  },
});
