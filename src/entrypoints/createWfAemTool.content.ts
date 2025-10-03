import { aemToolsMatch, type SavedLocalData } from "$lib/storage";
import { waitForElm } from "$lib/tools";

async function createWF(wfName: string, wfTitle: string) {
  await browser.storage.local.remove<SavedLocalData>(["wfName", "wfTitle"]);

  const panelContentElm = await waitForElm<HTMLElement>(
    "#cq-miscadmin-grid > div",
  );
  if (!panelContentElm) {
    throw new Error("panel content element wasn't found");
  }

  await waitForElm(
    "div.x-grid3-row-first > table > tbody > tr > td.x-grid3-td-title > div",
    panelContentElm,
  );

  const button = panelContentElm.querySelector<HTMLButtonElement>(
    "button.x-btn-text.cq-siteadmin-create-page-icon",
  );
  button?.click();

  const createPageOverlayElm = document.querySelector(
    ".x-panel.x-form-label-left > .x-panel-bwrap > .x-panel-body.x-panel-body-noheader",
  );
  if (!createPageOverlayElm) {
    throw new Error("create page overlay element not found");
  }

  const formWFTitle = await waitForElm<HTMLFormElement>(
    "div:nth-child(1) > div.x-form-element > input",
    createPageOverlayElm,
  );
  formWFTitle.value = wfTitle;

  const formWFName = createPageOverlayElm.querySelector<HTMLFormElement>(
    "div:nth-child(2) > div.x-form-element > input",
  );
  if (!formWFName) {
    throw new Error("form in WF AEM tools wasn't found");
  }
  formWFName.value = wfName;

  const promotionButton = await waitForElm(
    "div.x-panel.cq-template-view.x-panel-noborder > div > div > div > div.template-item:nth-child(3)",
    createPageOverlayElm,
  );
  promotionButton.click();
}

export default defineContentScript({
  matches: aemToolsMatch,
  runAt: "document_end",
  async main() {
    const { wfTitle, wfName } = await browser.storage.local.get<SavedLocalData>(
      {
        wfTitle: null,
        wfName: null,
      },
    );
    if (!wfTitle || !wfName) {
      return;
    }

    createWF(wfName, wfTitle);
  },
});
