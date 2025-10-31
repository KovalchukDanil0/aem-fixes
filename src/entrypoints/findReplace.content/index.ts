import "$assets/authorCustom.scss";
import { FindReplaceLink, InvalidLinks } from "$lib/content";
import { findReplaceMatch } from "$lib/storage";
import { waitForElm } from "$lib/tools";
import { mount } from "svelte";
import "./style.scss";

async function fixOldLinks() {
  const findReplaceBodySelector =
    "div.find-replace-links.ng-scope > div.content.ng-scope.last-concatenated";

  const findReplaceBody = await waitForElm(findReplaceBodySelector);
  if (!findReplaceBody) {
    return;
  }

  const { length: invalidLinksCount } = findReplaceBody.querySelectorAll(
    "div.one-link > div.is-invalid",
  );
  if (invalidLinksCount && findReplaceBody.firstChild) {
    mount(InvalidLinks, {
      target: findReplaceBody,
      anchor: findReplaceBody.firstChild,
      props: { invalidLinksCount },
    });
  }

  const oldLinks: NodeListOf<HTMLElement> = findReplaceBody.querySelectorAll(
    "div > div > div > div > div > span",
  );
  for (const link of oldLinks) {
    const url = link.textContent;
    if (!url) {
      throw new Error("link is null");
    }

    link.textContent = null;
    mount(FindReplaceLink, { target: link, props: { url } });
  }
}

export default defineContentScript({
  matches: findReplaceMatch,
  runAt: "document_end",
  allFrames: true,
  async main() {
    const validateButton = document.querySelector(
      "div.find-replace-links.ng-scope > div.content.first > div.root-path-selection > button:nth-child(4)",
    );
    validateButton?.addEventListener("click", fixOldLinks);
  },
});
