import { selectOne } from "css-select";
import { Document, Element, Text } from "domhandler";
import { parseDocument } from "htmlparser2";
import ky from "ky";

interface AnalyticsJson {
  "vehicle.bodystyle": string;
  "page.pageName": string;
}

type TagsType = Lowercase<`brand:${string}`>;

const tagsTable: Record<string, TagsType | TagsType[]> = {
  features: "brand:vehicle:features:",
  brochures: [
    "brand:brochures & pricelists",
    "brand:commercial:brochures & pricelists",
    "brand:brochures & pricelists:download overlay:",
  ],
  "build price": "brand:build:",
  "search new inventory": "brand:search inventory:results",
  "test drive": ["brand:test drive:", "brand:test drive booking:"],
  "get updates": "brand:get updates:",
  "view vehicle": [
    "brand:vehicle:overview:",
    "brand:future vehicles:vehicle:overview:",
  ],
  "contact dealer": [
    "brand:dealer contact request:contact details:",
    "brand:dealer contact request:select vehicle",
  ],
  "send to dealer": [
    "brand:dealer contact request:send to dealer:contact details:",
    "brand:dealer contact request:send to dealer:select vehicle",
  ],
  "view promotions": ["brand:promotions:", "brand:vehicle:promotions:"],
  "find dealer": ["brand:dealer locator", "brand:commercial:dealer locator"],
  "view technology": [
    "brand:technology:",
    "brand:commercial:technology:",
    "brand:commercial:technology:fordpass pro",
  ],
  "view fordpass": [
    "brand:commercial:technology:fordpass pro",
    "brand:technology:connectivity:fordpass",
  ],
  "car showroom": "brand:showroom:cars",
  "commercial showroom": "brand:showroom:commercial vehicles",
  "book service": "brand:owner:my vehicle:service booking:book service",
  "view service": "brand:owner:service & repairs:",
  "ask ford": "brand:owner:home:",
  "return home": "brand:home",
  "view electric & hybrid": "brand:electric & hybrid vehicles:",
};

export function getPageTag(dom: Document) {
  const analyticsPropertiesElm = selectOne(
    "#analytics-properties",
    dom.children as Element[],
  );
  if (!analyticsPropertiesElm) {
    return;
  }

  const [jsonData] =
    /{.+}/.exec((analyticsPropertiesElm.firstChild as Text).data) ?? [];
  if (!jsonData) {
    return;
  }

  return JSON.parse(jsonData) as AnalyticsJson;
}

export async function determinePageTag(url?: string) {
  if (!url) {
    return;
  }

  if (url.includes("mailto:") || url.includes("tel:")) {
    return "contact us";
  }

  const html = await ky.get<string>(url).text();
  const dom = parseDocument(html);

  const { "page.pageName": pageName } = getPageTag(dom) ?? {};
  if (!pageName) {
    return;
  }

  const pageTag = pageName.toLowerCase().trim();

  return Object.entries(tagsTable).find(([, value]) => {
    if (Array.isArray(value)) {
      return value.some((v) => pageTag === v);
    }
    return pageTag === value;
  })?.[0];
}
