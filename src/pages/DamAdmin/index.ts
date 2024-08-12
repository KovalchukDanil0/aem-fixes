import { getFullAuthorPath, regexDAMTree, touch } from "../../shared";

async function hasChange() {
  const url: string = window.location.href;
  const mav: string = url.replace(await regexDAMTree(), "$2");

  if (mav === "mavs") {
    const fullAuthorPath = await getFullAuthorPath();
    const linkPart: string = url.replace(await regexDAMTree(), "$1");

    window.open(`https://${fullAuthorPath}/${touch}${linkPart}`);
  }
}

window.addEventListener("hashchange", hasChange, false);
