import {
  AlertMothersite,
  ProgrammerError,
  ShowroomCodes,
  VehicleCode,
} from "$components/content";
import {
  isLive,
  isPerf,
  isProd,
  loadSavedData,
  regexAuthor,
} from "$lib/storage";
import { waitForElm } from "$lib/tools";
import ky from "ky";
import { mount } from "svelte";
import "~/styles/livePerf.scss";

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

function checkMothersite(from: FromType) {
  if (location.href.replace(regexAuthor, "$4") === "mothersite") {
    return;
  }

  const mothersiteLinks = document.querySelectorAll(
    "[href*='mothersite']",
  ).length;

  const text = `MOTHERSITE LINKS ON THIS PAGE - ${mothersiteLinks}`;

  if (mothersiteLinks > 0 && from === "content") {
    mount(AlertMothersite, {
      target: document.body,
      anchor: document.body.firstChild ?? undefined,
      props: { text },
    });
  } else {
    browser.runtime.sendMessage<MessageAlert>({
      from: "content",
      subject: "showMessage",
      color: mothersiteLinks === 0 ? "success" : "error",
      text,
    });
  }
}

const getCarByName = (data: CarProps[], value?: string): CarProps =>
  data.filter(({ desc }) => desc === value)[0];

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

  const wizardConfig = await waitForElm("span.configuration", wizardWindowElm);

  const config = `${wizardConfig.getAttribute(
    "data-nameplate-service",
  )}/${wizardConfig.getAttribute(
    "data-campaign-code",
  )}/${wizardConfig.getAttribute("data-site-id")}/${wizardConfig.getAttribute(
    "data-event-type",
  )}?locale=${wizardConfig.getAttribute("data-culture-code")}`;

  const cookieValue = await browser.runtime.sendMessage<MessageCommon>({
    from: "content",
    subject: "getCookie",
  });

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
    for (let index = 0; index < butContChildren.length; index++) {
      const but = butContChildren[index];
      but.addEventListener("click", () =>
        findVehicleCode(vehicleConfigResponse, wizardVehicleSelector, index),
      );
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

  allCars?.forEach((carElm) => {
    const carName = carElm.textContent?.trim();

    const carObj: CarProps = getCarByName(
      vehicleConfig.data[idx].eventItem,
      carName,
    );

    if (carElm.parentElement && carObj) {
      carElm.id = "carCode";

      let modelCode = carObj.wersCode;
      let versionCode: string;

      if (!modelCode) {
        modelCode = carObj.modelCode;
        versionCode = carObj.derivativeCode;
      } else {
        versionCode = carObj.wersDerivCode;
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
  });
}

async function findShowroomCode() {
  if (showroomShowed) {
    return;
  }

  const showroomElm = document.querySelector("#acc-showroom > span");
  if (!showroomElm) {
    await browser.runtime.sendMessage<MessageAlert>({
      from: "content",
      subject: "showMessage",
      text: "Please make sure you are on showroom page",
      color: "error",
    });
    return;
  }

  const config = showroomElm.getAttribute("data-bsl-url");
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
      await browser.runtime.sendMessage<MessageAlert>({
        from: "content",
        subject: "showMessage",
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

const getNextGenCarByName = (
  data: Segment[],
  value: string,
  idx = 0,
): Segment => data.filter(({ NamePlate }) => NamePlate === value)[idx];

async function nextGenCodes() {
  const element = await waitForElm(".host-container.tdb-root");
  const dataJson = element.getAttribute("data-json-path");
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

  carEntries?.forEach((car) => {
    const carName = car.querySelector("div.card-details > h3");

    if (!carName?.textContent) {
      throw new Error("car name is undefined");
    }

    const { VehicleCode: vehicleCode, NamePlateID } = getNextGenCarByName(
      DemoVehicleModels[0].Segments,
      carName.textContent,
    );

    const fullCode = `?vehicleCode=${vehicleCode}&nameplateId=${NamePlateID}`;

    mount(VehicleCode, {
      target: car,
      props: { code: fullCode },
    });
  });
}

const determineEnvironment = (): EnvTypesExtended | null => {
  if (isLive(location.href)) {
    return "live";
  }
  if (isPerf(location.href)) {
    return "perf";
  }
  if (isProd(location.href)) {
    return "prod";
  }
  return null;
};

export default defineContentScript({
  matches: JSON.parse(import.meta.env.VITE_LIVE_PERF_MATCH),
  runAt: "document_end",
  async main() {
    browser.runtime.onMessage.addListener(
      ({ from, subject }: MessageCommon, _, sendResponse) => {
        if (from !== "popup") {
          return;
        }

        if (subject === "getEnvironment") {
          sendResponse(determineEnvironment());
        }

        if (subject === "checkMothersite") {
          checkMothersite(from);
        }

        if (subject === "showShowroomConfig") {
          findShowroomCode();
        }
      },
    );

    const { disMothersiteCheck, enableFunErr } = await loadSavedData();

    if (!disMothersiteCheck) {
      checkMothersite("content");
    }

    if (enableFunErr) {
      randomProgrammerMemes();
    }

    vehicleCodeInit();
    nextGenCodes();
  },
});
