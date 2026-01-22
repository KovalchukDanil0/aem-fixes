export function waitForElm<T extends HTMLElement>(
  selector: string,
  parent: Element = document.body,
): Promise<T> {
  return new Promise((resolve) => {
    const result = parent.querySelector<T>(selector);
    if (result) {
      resolve(result);
      return;
    }

    const observer = new MutationObserver(() => {
      const result = parent.querySelector<T>(selector);
      if (result) {
        resolve(result);

        observer.disconnect();
      }
    });

    observer.observe(parent, {
      childList: true,
      subtree: true,
    });
  });
}
