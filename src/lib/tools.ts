export function waitForElm<T extends HTMLElement>(
  selector: string,
  parent: Element = document.body,
): Promise<T> {
  return new Promise((resolve) => {
    if (parent.querySelector(selector)) {
      return resolve(parent.querySelector(selector) as T);
    }

    const observer = new MutationObserver(() => {
      if (parent.querySelector(selector)) {
        resolve(parent.querySelector(selector) as T);
        observer.disconnect();
      }
    });

    observer.observe(parent, {
      childList: true,
      subtree: true,
    });
  });
}

export const camelToSnakeCase = (str: string) =>
  str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
