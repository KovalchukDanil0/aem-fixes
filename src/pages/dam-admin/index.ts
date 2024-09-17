import { getFullAuthorPath, regexDAMTree, touch } from "../../shared";

window.addEventListener("hashchange", hasChange, false);
async function hasChange() {
  const regexDamTreeCached = await regexDAMTree();

  const url: string = window.location.href;
  const mav: string = url.replace(regexDamTreeCached, "$2");

  if (mav === "mavs") {
    const fullAuthorPath = await getFullAuthorPath();
    const linkPart: string = url.replace(regexDamTreeCached, "$1");

    window.open(`https://${fullAuthorPath}/${touch}${linkPart}`);
  }
}
