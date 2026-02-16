import {
  AlertMothersite,
  ProgrammerError,
  ShowroomCodes,
  VehicleCode,
} from "$lib/content";
import { onMessage, sendMessage } from "$lib/messaging";
import {
  isLive,
  isPerf,
  isProd,
  livePerfMatch,
  loadSavedData,
  regexAuthor,
} from "$lib/storage";
import { waitForElm } from "$lib/utils";
import ky from "ky";
import { mount } from "svelte";

let lastVehicleIndex = -1;

let showroomShowed = false;

interface VehicleConfig {
  data: Data[];
}

interface Data {
  eventItem: CarProps[];
}

interface CarProps {
  itemCode: string;
  desc: string;
  modelCode: string;
  modelName: string;
  derivativeCode: string;
  derivativeDesc: string;
  franchise: string;
  sequence: string;
  omnitureDesc: string;
  omnitureModelYear: string;
  omnitureBrochureType: string;
  wersCode: string;
  wersDerivCode: string;
}

interface DemoVehiclesType {
  DemoVehicleModels: DemoVehicleModel[];
}

interface DemoVehicleModel {
  Segments: Segment[];
}

interface Segment {
  Status: string;
  VehicleCode: string;
  NamePlateID: string;
  NamePlate: string;
}

interface AppConfigType {
  ":items": {
    root: { ":items": { endpoints: { getDemoVehicles: string } } };
  };
}

const isMothersite = () =>
  location.href.replace(regexAuthor, "$4") === "mothersite";

async function randomProgrammerMemes() {
  if (document.title !== "404") {
    return;
  }

  const billboardContainer = "div > div.billboard-inner > .component-content";

  const billboardElm = document.querySelector<HTMLElement>(
    `#accelerator-page > div.content > div > div.box-content.cq-dd-image > div > div.billboard.billboard-image-sets-height ${billboardContainer}` +
      "," +
      `#global-ux > div.content.clearfix > div:nth-child(1) > div.billboard.section > ${billboardContainer}`,
  );

  if (!billboardElm) {
    return;
  }

  const githubPath =
    "https://raw.githubusercontent.com/deep5050/programming-memes/main/";

  const memesData = await ky
    .get(`${githubPath}memes.json`)
    .json<MemeResponseType>();

  // Removing all children of element
  billboardElm.replaceChildren();

  mount(ProgrammerError, {
    target: billboardElm,
    props: { githubPath, memesData },
  });
}

async function checkMothersite(fromPopup: boolean) {
  if (isMothersite()) {
    return;
  }

  const mothersiteLinks = document.querySelectorAll(
    "[href*='mothersite']",
  ).length;

  const text = `MOTHERSITE LINKS ON THIS PAGE - ${mothersiteLinks.toString()}`;

  if (fromPopup) {
    await sendMessage("showMessage", {
      color: mothersiteLinks === 0 ? "success" : "error",
      text,
    });
    return;
  }

  if (mothersiteLinks > 0) {
    mount(AlertMothersite, {
      target: document.body,
      anchor: document.body.firstChild ?? undefined,
      props: { text },
    });
  }
}

const getCarByName = (data?: CarProps[], value?: string) =>
  data?.find(({ desc }) => desc === value);

async function vehicleCodeInit() {
  const wizardWindowElm = document.querySelector<HTMLDivElement>(
    "div.wizard.initialized-wizard.ng-scope",
  );
  if (!wizardWindowElm) {
    return;
  }

  await waitForElm(
    "div.ng-scope > div > div.steps-wrapper.full-view > div.wizard-vehicle-selector.ng-scope > div.vehicle-list > figure:nth-child(1)",
    wizardWindowElm,
  );

  const wizardVehicleSelector = document.querySelector(
    ".wizard-vehicle-selector",
  );

  const buttonContainer = wizardVehicleSelector?.querySelector<HTMLElement>(
    "div.category-buttons > div.category-buttons-container",
  );

  const {
    dataset: { nameplateService, campaignCode, siteId, eventType, cultureCode },
  } = await waitForElm("span.configuration", wizardWindowElm);
  if (
    !nameplateService ||
    !campaignCode ||
    !siteId ||
    !eventType ||
    !cultureCode
  ) {
    return;
  }

  const config = `${nameplateService}/${
    campaignCode
  }/${siteId}/${eventType}?locale=${cultureCode}`;

  const cookieValue = await sendMessage("getCookie", undefined);
  if (!cookieValue) {
    return;
  }

  const vehicleConfigResponse = await ky
    .get(config, {
      headers: {
        Accept: "application/json",
        Authorizationtemp: `Bearer ${cookieValue}`,
      },
    })
    .json<VehicleConfig>();

  const butContChildren = buttonContainer?.children;
  if (butContChildren) {
    for (const [idx, but] of Array.from(butContChildren).entries()) {
      but.addEventListener("click", () => {
        findVehicleCode(vehicleConfigResponse, wizardVehicleSelector, idx);
      });
    }
  }

  findVehicleCode(vehicleConfigResponse, wizardVehicleSelector);
}

function findVehicleCode(
  vehicleConfig: VehicleConfig,
  wizardVehicleSelector: Element | null,
  idx = 0,
) {
  if (lastVehicleIndex === idx) {
    return;
  }

  lastVehicleIndex = idx;

  const allCars = wizardVehicleSelector?.querySelectorAll(
    "div.vehicle-list > figure > div > figcaption > a:not(#carCode)",
  );
  if (!allCars) {
    return;
  }

  for (const carElm of allCars) {
    const carName = carElm.textContent.trim();

    const carObj = getCarByName(vehicleConfig.data[idx]?.eventItem, carName);

    if (carElm.parentElement && carObj) {
      carElm.id = "carCode";

      let modelCode = carObj.wersCode;
      let versionCode: string;

      if (modelCode) {
        versionCode = carObj.wersDerivCode;
      } else {
        modelCode = carObj.modelCode;
        versionCode = carObj.derivativeCode;
      }

      let fullCode = modelCode;
      if (versionCode) {
        fullCode += `-${versionCode}`;
      }

      mount(VehicleCode, {
        target: carElm.parentElement,
        props: { code: fullCode },
      });
    }
  }
}

async function findShowroomCode() {
  if (showroomShowed) {
    return;
  }

  const showroomElm = document.querySelector<HTMLElement>(
    "#acc-showroom > span",
  );
  if (!showroomElm) {
    await sendMessage("showMessage", {
      text: "Please make sure you are on showroom page",
      color: "error",
    });

    return;
  }

  const config = showroomElm.dataset.bslUrl;
  if (!config) {
    throw new Error("showroom config `data-bsl-url` is null");
  }

  const { data: showroomConfig } = await ky
    .get(config, {
      headers: {
        Accept: "application/json",
      },
    })
    .json<ShowroomCode>()
    .catch(async () => {
      await sendMessage("showMessage", {
        text: "Please log in to AEM account, or try to refresh page",
        color: "error",
      });

      return { data: null };
    });

  if (!showroomConfig) {
    throw new Error(`Cannot reach showroom config page: ${config}`);
  }

  const target = showroomElm.parentElement;
  if (!target) {
    throw new Error("Cannot get parent element of the showroom");
  }

  showroomShowed = true;

  mount(ShowroomCodes, {
    props: { data: showroomConfig },
    target,
  });
}

const getNextGenCarByName = (value: string, data?: Segment[], idx = 0) =>
  data?.filter(({ NamePlate }) => NamePlate === value)[idx];

async function nextGenCodes() {
  const element = await waitForElm(".host-container.tdb-root");
  const dataJson = element.dataset.jsonPath;
  if (!dataJson) {
    throw new Error("data is undefined, cannot get data-json-path attribute");
  }

  const { href: fullPath } = new URL(dataJson, origin);

  const {
    ":items": {
      root: {
        ":items": {
          endpoints: { getDemoVehicles },
        },
      },
    },
  } = await ky.get(fullPath).json<AppConfigType>();

  const { DemoVehicleModels } = await ky
    .get(getDemoVehicles)
    .json<DemoVehiclesType>();

  const vehicleCardList =
    element.querySelector<HTMLElement>(".vehicle-card-list");
  if (!vehicleCardList) {
    throw new Error("TBD root doesn't have vehicle-card-list element");
  }

  const carEntries = vehicleCardList.querySelectorAll<HTMLElement>(
    ".vehicle-card-container",
  );

  for (const car of carEntries) {
    const carName = car.querySelector("div.card-details > h3");

    if (!carName?.textContent) {
      throw new Error("car name is undefined");
    }

    const { VehicleCode: vehicleCode, NamePlateID: nameplateId } =
      getNextGenCarByName(
        carName.textContent,
        DemoVehicleModels[0]?.Segments,
      ) ?? {};
    if (!vehicleCode || !nameplateId) {
      return;
    }

    const fullCode = new URLSearchParams({
      vehicleCode,
      nameplateId,
    });

    mount(VehicleCode, {
      target: car,
      props: { code: fullCode.toString() },
    });
  }
}

const determineEnvironment = (): EnvTypes | undefined => {
  if (isLive(location.href)) {
    return "live";
  }
  if (isPerf(location.href)) {
    return "perf";
  }
  if (isProd(location.href)) {
    return "prod";
  }
};

export default defineContentScript({
  matches: livePerfMatch,
  runAt: "document_end",
  async main() {
    onMessage("getEnvironment", determineEnvironment);
    onMessage("showShowroomConfig", findShowroomCode);
    onMessage("checkMothersite", () => checkMothersite(true));
    onMessage("getUrlPageTag", ({ data: { pageTag } }) => {
      alert(pageTag + "\nearly beta!!!");
    });

    if (!isMothersite()) {
      await sendMessage("injectMothersiteCss");
    }

    const { disMothersiteCheck, enableFunErr } = await loadSavedData();

    if (!disMothersiteCheck) {
      await checkMothersite(false);
    }

    if (enableFunErr) {
      await randomProgrammerMemes();
    }

    await vehicleCodeInit();
    await nextGenCodes();
  },
});
