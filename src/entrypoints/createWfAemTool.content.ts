import { waitForElm } from "$lib/tools";

async function createWF({ WFName, WFTitle }: SavedLocalData) {
  if (!WFTitle || !WFName) {
    return;
  }

  await browser.storage.local.remove<SavedLocalData>(["WFName", "WFTitle"]);

  const panelContentElm = await waitForElm<HTMLElement>(
    "#cq-miscadmin-grid > div",
  );
  if (!panelContentElm) {
    throw new Error("panel content element wasn't found");
  }

  await waitForElm(
    "div.x-panel-body.x-panel-body-noheader > div > div.x-grid3-viewport > div.x-grid3-scroller > div > div.x-grid3-row.x-grid3-row-first > table > tbody > tr > td.x-grid3-col.x-grid3-cell.x-grid3-td-title > div",
    panelContentElm,
  );

  const button = panelContentElm.querySelector<HTMLButtonElement>(
    "div.x-panel-tbar.x-panel-tbar-noheader > div > table > tbody > tr > td.x-toolbar-left > table > tbody > tr > td:nth-child(3) > table > tbody > tr:nth-child(2) > td.x-btn-mc > em > button",
  );
  button?.click();

  const createPageOverlayElm = document.querySelector(
    "#CQ > div.x-window-plain.x-form-label-left > div > form > div.x-window.x-window-plain.x-resizable-pinned > div.x-window-bwrap > div.x-window-ml > div > div > div > div > div > div",
  );
  if (!createPageOverlayElm) {
    throw new Error("create page overlay element not found");
  }

  const formWFTitle = await waitForElm<HTMLFormElement>(
    "div:nth-child(1) > div.x-form-element > input",
    createPageOverlayElm,
  );
  formWFTitle.value = WFTitle;

  const formWFName = createPageOverlayElm.querySelector<HTMLFormElement>(
    "div:nth-child(2) > div.x-form-element > input",
  );
  if (!formWFName) {
    throw new Error("form in WF AEM tools wasn't found");
  }
  formWFName.value = WFName;

  const promotionButton = await waitForElm(
    "div.x-panel.cq-template-view.x-panel-noborder > div > div > div > div.template-item:nth-child(3)",
    createPageOverlayElm,
  );
  promotionButton.click();
}

export default defineContentScript({
  matches: [import.meta.env.VITE_AEM_TOOLS_MATCH],
  runAt: "document_end",
  async main() {
    const { WFTitle, WFName } = await browser.storage.local.get<SavedLocalData>(
      {
        WFTitle: "",
        WFName: "",
      },
    );

    createWF({ WFName, WFTitle });
  },
});
