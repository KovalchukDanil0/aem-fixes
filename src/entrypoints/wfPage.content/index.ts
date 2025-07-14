import { WFOpenAllPages, WFUsefulLinks } from "$components/content";
import { regexDetermineBeta, wfPageMatch } from "$lib/storage";
import { waitForElm } from "$lib/tools";
import "$styles/authorCustom.scss";
import { mount } from "svelte";
import "./wfPage.scss";

function addBetaToLink(link: HTMLAnchorElement) {
  link.href = link.href.replace(regexDetermineBeta, `$1/${"editor.html"}$2`);
}

function addWorkflowId() {
  const sectionSelector = ".page.section > .configSection > div a";

  const getLinksInWF: NodeListOf<HTMLAnchorElement> =
    document.querySelectorAll(sectionSelector);

  const workflowID = location.href.replace(/.+\/(.+)\.html.*$/, "$1");

  const workflowTitleInput = document.querySelector<HTMLFormElement>(
    "#workflow-title-input",
  );
  if (!workflowTitleInput) {
    return;
  }

  workflowTitleInput.value = workflowID;
  getLinksInWF.forEach((link) => addBetaToLink(link));

  const requestButton = document.querySelector<HTMLButtonElement>(
    "#start-request-workflow",
  );
  requestButton?.removeAttribute("disabled");
}

function usefulLinks() {
  const target = document.querySelector(
    "body > div.wrapper-conf > div > div.content-conf.workflow-package-page > div.configSection > div > div:nth-child(2)",
  );
  if (!target) {
    return;
  }

  mount(WFUsefulLinks, { target });
}

function openAllPagesButton() {
  const buttonsContainer = document.querySelector<HTMLDivElement>(
    "body > div.wrapper-conf > div > div.content-conf.workflow-package-page > div.configSection > div > div:nth-child(2)",
  );
  if (!buttonsContainer) {
    throw new Error("button container wasn't found");
  }

  mount(WFOpenAllPages, { target: buttonsContainer });
}

async function checkNodes() {
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

export default defineContentScript({
  matches: wfPageMatch,
  runAt: "document_end",
  allFrames: true,
  main() {
    addWorkflowId();
    usefulLinks();
    openAllPagesButton();
    checkNodes();
  },
});
