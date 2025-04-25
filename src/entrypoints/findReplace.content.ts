import { FindReplaceLink, InvalidLinks } from "$components/content";
import { waitForElm } from "$lib/tools";
import "$styles/authorCustom.scss";
import "$styles/findReplace.scss";
import { mount } from "svelte";

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
  if (invalidLinksCount !== 0 && findReplaceBody.firstChild) {
    mount(InvalidLinks, {
      target: findReplaceBody,
      anchor: findReplaceBody.firstChild,
      props: { invalidLinksCount },
    });
  }

  const oldLinks: NodeListOf<HTMLElement> = findReplaceBody.querySelectorAll(
    "div > div > div > div > div > span",
  );
  oldLinks.forEach((link) => {
    const url = link.textContent;
    if (!url) {
      throw new Error("link is null");
    }

    link.textContent = "";
    mount(FindReplaceLink, { target: link, props: { url } });
  });
}

export default defineContentScript({
  matches: [import.meta.env.VITE_FIND_REPLACE_MATCH],
  runAt: "document_end",
  allFrames: true,
  async main() {
    const validateButton = document.querySelector(
      "div.find-replace-links.ng-scope > div.content.first > div.root-path-selection > button:nth-child(4)",
    );
    validateButton?.addEventListener("click", fixOldLinks);
  },
});
