import { getFullAuthorPath, getRegexDAMTree } from "src/lib/storage";

window.addEventListener(
  "hashchange",
  async function hasChange(): Promise<void> {
    const regexDamTreeCached = await getRegexDAMTree();

    const url: string = window.location.href;
    const mav: string = url.replace(regexDamTreeCached, "$2");

    if (mav === "mavs") {
      const fullAuthorPath = await getFullAuthorPath();
      const linkPart: string = url.replace(regexDamTreeCached, "$1");

      window.open(`https://${fullAuthorPath}/${"editor.html"}${linkPart}`);
    }
  },
  false,
);
