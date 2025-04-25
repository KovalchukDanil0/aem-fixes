import { fullAuthorPath, regexDAMTree } from "$lib/storage";

export default defineContentScript({
  matches: [import.meta.env.VITE_DAM_TREE_MATCH],
  runAt: "document_end",
  main() {
    window.addEventListener(
      "hashchange",
      async function hasChange(): Promise<void> {
        const url: string = window.location.href;

        const matchDamTree = regexDAMTree.exec(url);
        if (!matchDamTree) {
          throw new Error("Regex not matched Dam Tree");
        }

        const [, linkPart, mavPart] = matchDamTree;

        if (mavPart === "mavs") {
          window.open(`https://${fullAuthorPath}/editor.html${linkPart}`);
        }
      },
      false,
    );
  },
});
