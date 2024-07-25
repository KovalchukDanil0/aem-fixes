import "cirrus-ui";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
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

    const a = createElement(
      "a",
      {
        className: "findReplaceLink",
        onClick() {
          Browser.runtime.sendMessage(message);
        },
      },
      url,
    );

    const root = createRoot(link);
    root.render(a);
  });
}

(async function Main() {
  const validateButton = await waitForElm(
    "#cq-gen4 > div.wrapper-conf > div > div.find-replace-links.ng-scope > div.content.first > div.root-path-selection > button:nth-child(4)",
  );
  validateButton.addEventListener("click", fixOldLinks);
})();
