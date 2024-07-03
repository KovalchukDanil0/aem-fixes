import "cirrus-ui";
import { el, mount } from "redom";
import Browser from "webextension-polyfill";
import { MessageCommon, waitForElm } from "../../shared";
import "./index.scss";

async function fixOldLinks() {
  await waitForElm(
    "#cq-gen4 > div.wrapper-conf > div > div.find-replace-links.ng-scope > div.content.ng-scope.last-concatenated > div > div > div > div.one-resource-header",
  );

  const oldLinks: NodeListOf<HTMLElement> = document.querySelectorAll(
    "#cq-gen4 > div.wrapper-conf > div > div.find-replace-links.ng-scope > div.content.ng-scope.last-concatenated > div > div > div > div > div > span",
  );
  oldLinks.forEach((link) => {
    const url: string | null = link.textContent;
    if (!url) {
      throw new Error("link is null");
    }

    const message: MessageCommon = {
      from: "content",
      subject: "openInTree",
      url,
    };

    link.innerHTML = "";

    const a = el("a.findReplaceLink", { textContent: url });
    a.addEventListener("click", function () {
      Browser.runtime.sendMessage(message);
    });

    mount(link, a);
  });
}

(async function Main() {
  const validateButton = await waitForElm(
    "#cq-gen4 > div.wrapper-conf > div > div.find-replace-links.ng-scope > div.content.first > div.root-path-selection > button:nth-child(4)",
  );
  validateButton.addEventListener("click", fixOldLinks);
})();
