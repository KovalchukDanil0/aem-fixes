import { damTreeMatch, fullAuthorPath, regexDAMTree } from "$lib/storage";

export default defineContentScript({
  matches: damTreeMatch,
  runAt: "document_end",
  main() {
    globalThis.addEventListener(
      "hashchange",
      function hasChange() {
        const url: string = globalThis.location.href;

        const matchDamTree = regexDAMTree.exec(url);
        if (!matchDamTree) {
          throw new Error("Regex not matched Dam Tree");
        }

        const [, linkPart, mavPart] = matchDamTree;

        if (mavPart === "mavs" && linkPart) {
          globalThis.open(`https://${fullAuthorPath}/editor.html${linkPart}`);
        }
      },
      false,
    );
  },
});
