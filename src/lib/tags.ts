import { selectOne } from "css-select";
import { Document, Element, Text } from "domhandler";
import { parseDocument } from "htmlparser2";
import ky from "ky";

interface TagsTableType {
  ctaName: string;
  pageNames: string[];
}

interface FordAnalyticsType {
  "vehicle.bodystyle"?: string;
  "page.pageName"?: string;
}

const tagsTable: TagsTableType[] = [
  {
    ctaName: "build price",
    pageNames: ["brand:build:"],
  },
  {
    ctaName: "search new inventory",
    pageNames: ["brand:search inventory:results"],
  },
  {
    ctaName: "test drive",
    pageNames: ["brand:test drive:", "brand:test drive booking:"],
  },
  {
    ctaName: "get updates",
    pageNames: ["brand:get updates:"],
  },
  {
    ctaName: "view vehicle",
    pageNames: [
      "brand:vehicle:overview:",
      "brand:future vehicles:vehicle:overview:",
    ],
  },
  {
    ctaName: "brochures",
    pageNames: [
      "brand:brochures & pricelists",
      "brand:commercial:brochures & pricelists",
      "brand:brochures & pricelists:download overlay:",
    ],
  },
  {
    ctaName: "contact dealer",
    pageNames: [
      "brand:dealer contact request:contact details:",
      "brand:dealer contact request:select vehicle",
    ],
  },
  {
    ctaName: "send to dealer",
    pageNames: [
      "brand:dealer contact request:send to dealer:contact details:",
      "brand:dealer contact request:send to dealer:select vehicle",
    ],
  },
  {
    ctaName: "view promotions",
    pageNames: ["brand:promotions:", "brand:vehicle:promotions:"],
  },
  {
    ctaName: "find dealer",
    pageNames: ["brand:dealer locator", "brand:commercial:dealer locator"],
  },
  {
    ctaName: "view technology",
    pageNames: [
      "brand:technology:",
      "brand:commercial:technology:",
      "brand:commercial:technology:fordpass pro",
    ],
  },
  {
    ctaName: "view fordpass",
    pageNames: [
      "brand:commercial:technology:fordpass pro",
      "brand:technology:connectivity:fordpass",
    ],
  },
  {
    ctaName: "car showroom",
    pageNames: ["brand:showroom:cars"],
  },
  {
    ctaName: "commercial showroom",
    pageNames: ["brand:showroom:commercial vehicles"],
  },
  {
    ctaName: "book service",
    pageNames: ["owner:my vehicle:service booking:book service"],
  },
  {
    ctaName: "view service",
    pageNames: ["brand:owner:service & repairs:"],
  },

  {
    ctaName: "features",
    pageNames: ["brand:vehicle:features:"],
  },
  {
    ctaName: "ask ford",
    pageNames: ["owner:home:"],
  },
  {
    ctaName: "return home",
    pageNames: ["brand:home"],
  },
  {
    ctaName: "view electric & hybrid",
    pageNames: ["brand:electric & hybrid vehicles:"],
  },
];

export function getPageTag(dom: Document): FordAnalyticsType {
  const analyticsPropertiesElm = selectOne(
    "#analytics-properties",
    dom.children as Element[],
  );
  if (!analyticsPropertiesElm) {
    return {};
  }

  const [jsonData] =
    /{.+}/.exec((analyticsPropertiesElm.children[0] as Text).data) ?? [];
  console.log(jsonData);

  if (!jsonData) {
    return {};
  }

  return JSON.parse(jsonData) as FordAnalyticsType;
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

  const { "page.pageName": pageName } = getPageTag(dom);
  if (!pageName) {
    return;
  }

  const pageTagNormalized = pageName.toLowerCase().trim();

  for (const { ctaName, pageNames } of tagsTable) {
    if (
      pageNames.some((pageNameTag) =>
        pageTagNormalized.includes(pageNameTag.toLowerCase()),
      )
    ) {
      return ctaName;
    }
  }
}
