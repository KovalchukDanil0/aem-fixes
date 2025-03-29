import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { waitForElm } from "src/lib/tools";
import { MessageCommon } from "src/lib/types";
import { runtime } from "webextension-polyfill";
import "./index.scss";

async function fixOldLinks(): Promise<void> {
  const findReplaceBodySelector =
    "div.find-replace-links.ng-scope > div.content.ng-scope.last-concatenated";

  const findReplaceBody = await waitForElm(findReplaceBodySelector);

  const { length: redLinksLength } = findReplaceBody.querySelectorAll(
    "div.one-link > div.is-invalid",
  );
  if (redLinksLength !== 0) {
    const rootDiv = document.createElement("span");
    const root = createRoot(
      findReplaceBody.insertBefore(rootDiv, findReplaceBody.firstChild),
    );

    const redLinksCountElm = createElement(
      "p",
      { className: "toast toast--primary" },
      `${redLinksLength.toString()} INVALID LINKS FOUND!`,
    );

    root.render(redLinksCountElm);
  }

  const oldLinks: NodeListOf<HTMLElement> = findReplaceBody.querySelectorAll(
    "div > div > div > div > div > span",
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
          runtime.sendMessage(message);
        },
      },
      url,
    );

    const root = createRoot(link);
    root.render(a);
  });
}

// Main logic

const validateButton = await waitForElm(
  "div.find-replace-links.ng-scope > div.content.first > div.root-path-selection > button:nth-child(4)",
);
validateButton.addEventListener("click", fixOldLinks);
