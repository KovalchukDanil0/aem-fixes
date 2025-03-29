import { getFullAuthorPath, getRegexDAMTree } from "src/lib/storage";

window.addEventListener(
  "hashchange",
  async function hasChange(): Promise<void> {
    const regexDamTree = await getRegexDAMTree();

    const url: string = window.location.href;

    const matchDamTree = regexDamTree.exec(url);
    if (!matchDamTree) {
      throw new Error("Regex not matched Dam Tree");
    }

    const [, linkPart, mavPart] = matchDamTree;

    if (mavPart === "mavs") {
      const fullAuthorPath = await getFullAuthorPath();

      window.open(`https://${fullAuthorPath}/editor.html${linkPart}`);
    }
  },
  false,
);
