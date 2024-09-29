import { Tabs, tabs } from "webextension-polyfill";

export function waitForElm<T extends HTMLElement>(
  selector: string,
  elm: Element = document.body,
): Promise<T> {
  return new Promise((resolve) => {
    if (elm.querySelector(selector)) {
      return resolve(elm.querySelector(selector) as T);
    }

    const observer = new MutationObserver(() => {
      if (elm.querySelector(selector)) {
        resolve(elm.querySelector(selector) as T);
        observer.disconnect();
      }
    });

    observer.observe(elm, {
      childList: true,
      subtree: true,
    });
  });
}

export function waitForElmAll<T extends NodeListOf<HTMLElement>>(
  selector: string,
  doc: Document = document,
): Promise<T> {
  return new Promise((resolve) => {
    if (doc.querySelectorAll(selector)) {
      return resolve(doc.querySelectorAll(selector) as T);
    }

    const observer = new MutationObserver(() => {
      if (doc.querySelectorAll(selector)) {
        resolve(doc.querySelectorAll(selector) as T);
        observer.disconnect();
      }
    });

    observer.observe(doc.body, {
      childList: true,
      subtree: true,
    });
  });
}

export const getCurrentTab = async (): Promise<Tabs.Tab> =>
  (await tabs.query({ active: true, currentWindow: true }))[0];

export async function findAsyncSequential<T>(
  array: T[],
  predicate: (t: T) => Promise<boolean>,
): Promise<T | undefined> {
  for (const t of array) {
    if (await predicate(t)) {
      return t;
    }
  }
}
