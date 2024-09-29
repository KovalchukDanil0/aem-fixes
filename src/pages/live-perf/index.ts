import axios from "axios";
import { createElement, ReactElement } from "react";
import { createRoot } from "react-dom/client";
import ShowroomCodes from "src/components/ShowroomCodes";
import { getRegexAuthor, loadSavedData } from "src/lib/storage";
import { waitForElm } from "src/lib/tools";
import {
  FromTypes,
  MessageAlert,
  MessageCommon,
  ShowroomCode,
} from "src/lib/types";
import { runtime } from "webextension-polyfill";
import "./index.scss";

let lastVehicleIndex = -1;

type VehicleConfig = {
  data: Data[];
};

type Data = {
  eventItem: CarProps[];
};

type CarProps = {
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
};

type DemoVehiclesType = {
  DemoVehicleModels: DemoVehicleModel[];
};

type DemoVehicleModel = {
  Segments: Segment[];
};

type Segment = {
  Status: string;
  VehicleCode: string;
  NamePlateID: string;
  NamePlate: string;
};

type MemeResponseType = {
  [key: string]: { path: string };
};

async function randomProgrammerMemes(): Promise<void> {
  if (document.title !== "404") {
    return;
  }

  const githubPath =
    "https://raw.githubusercontent.com/deep5050/programming-memes/main/";

  const { data: memesData } = await axios.get<MemeResponseType>(
    githubPath + "memes.json",
  );
  const { length } = Object.keys(memesData);

  //Extracting data
  const memeImage = memesData[generateRandom(length - 1)].path;

  const billboardContainer = document.querySelector<HTMLElement>(
    "#accelerator-page > div.content > div > div.box-content.cq-dd-image > div > div.billboard.billboard-image-sets-height > div > div.billboard-inner," +
      "#global-ux > div.content.clearfix > div:nth-child(1) > div.billboard.section > div > div.billboard-inner",
  );

  if (!billboardContainer) {
    throw new Error("Cannot find Billboard parent div");
  }

  const billboardImages =
    billboardContainer.querySelector<HTMLElement>("div > picture");

  const billboardText = billboardContainer.querySelector<HTMLElement>(
    "div.billboard-paragraph",
  );

  billboardText?.remove();

  (billboardImages?.childNodes as NodeListOf<HTMLSourceElement>).forEach(
    (image) => {
      image.srcset = githubPath + memeImage;
    },
  );
}

const generateRandom = (maxLimit: number): number =>
  Math.floor(Math.random() * maxLimit);

async function checkMothersite(from: FromTypes): Promise<void> {
  if (location.href.replace(await getRegexAuthor(), "$4") === "mothersite") {
    return;
  }

  const links: NodeListOf<HTMLLinkElement> =
    document.querySelectorAll("[href]");

  let mothersiteLinks = 0;
  links.forEach(({ href, style }) => {
    if (href.includes("mothersite")) {
      style.backgroundColor = "blue";
      style.filter = "invert(100%)";

      mothersiteLinks += 1;
    }
  });

  const message = `MOTHERSITE LINKS ON THIS PAGE - ${mothersiteLinks}`;

  if (mothersiteLinks > 0 && from === "content") {
    const rootDiv = document.createElement("span");

    const root = createRoot(
      document.body.insertBefore(rootDiv, document.body.firstChild),
    );

    const alertBannerElm = createElement(
      "div",
      { className: "alertBanner" },
      createElement("h2", {}, message),
      createElement(
        "button",
        {
          onClick() {
            root.unmount();
          },
        },
        "X",
      ),
    );

    root.render(alertBannerElm);
  } else {
    runtime.sendMessage({
      from: "content",
      subject: "showMessage",
      color: mothersiteLinks === 0 ? "success" : "error",
      message,
    } as MessageAlert);
  }
}

const getCarByName = (data: CarProps[], value?: string): CarProps =>
  data.filter(({ desc }) => desc === value)[0];

async function vehicleCodeInit(): Promise<void> {
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

  const cookieValue: string | null = await runtime.sendMessage({
    from: "content",
    subject: "getCookie",
  } as MessageCommon);

  const { data: vehicleConfigResponse } = await axios.get<VehicleConfig>(
    config,
    {
      headers: {
        Accept: "application/json",
        Authorizationtemp: `Bearer ${cookieValue}`,
      },
    },
  );

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

async function findVehicleCode(
  vehicleConfig: VehicleConfig,
  wizardVehicleSelector: Element | null,
  idx = 0,
): Promise<void> {
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

      const vehicleCodeElm = createElement(
        "a",
        {
          className: "carCodeElm",
          href: `?vehicleCode=${fullCode}`,
        },
        fullCode,
      );

      const div = document.createElement("div");
      const root = createRoot(carElm.parentElement.appendChild(div));
      root.render(vehicleCodeElm);
    }
  });
}

async function findShowroomCode(): Promise<void> {
  const showroomElm = await waitForElm("#acc-showroom > span");

  const config = showroomElm.getAttribute("data-bsl-url");
  if (!config) {
    throw new Error("showroom config `data-bsl-url` is null");
  }

  const {
    data: { showroomConfig },
  } = await axios.get<ShowroomCode>(config, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!showroomConfig) {
    throw new Error("Cannot reach showroom config page");
  }

  const showroomCodes: ReactElement = ShowroomCodes({
    showroomConfig,
  });

  const showroom = await waitForElm("#acc-showroom");
  const rootElm = document.createElement("span");

  const root = createRoot(showroom.appendChild(rootElm));
  root.render(showroomCodes);
}

runtime.onMessage.addListener(({ from, subject }: MessageCommon): void => {
  if (from === "popup" && subject === "checkMothersite") {
    checkMothersite(from);
  }
});

const getNextGenCarByName = (data: Segment[], value: string): Segment =>
  data.filter(({ NamePlate }) => NamePlate === value)[0];

async function nextGenCodes(): Promise<void> {
  const element = await waitForElm(".host-container.tdb-root");
  const dataJson = element.getAttribute("data-json-path");
  if (!dataJson) {
    throw new Error("data is undefined, cannot get data-json-path attribute");
  }

  const { href: fullPath } = new URL(dataJson, origin);
  const { data: appConfig } = await axios.get<{
    ":items": {
      root: { ":items": { endpoints: { getDemoVehicles: string } } };
    };
  }>(fullPath);

  const {
    data: { DemoVehicleModels },
  } = await axios.get<DemoVehiclesType>(
    appConfig[":items"].root[":items"].endpoints.getDemoVehicles,
  );

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

    const { VehicleCode, NamePlateID } = getNextGenCarByName(
      DemoVehicleModels[0].Segments,
      carName.textContent,
    );

    const fullCode = `?vehicleCode=${VehicleCode}&nameplateId=${NamePlateID}`;
    const vehicleCodeElm = createElement(
      "a",
      {
        href: fullCode,
      },
      fullCode,
    );

    const rootDiv = document.createElement("span");

    const root = createRoot(
      vehicleCardList.insertBefore(rootDiv, car.nextSibling),
    );
    root.render(vehicleCodeElm);
  });
}

(async function () {
  const { disMothersiteCheck, enableFunErr } = await loadSavedData();

  if (!disMothersiteCheck) {
    checkMothersite("content");
  }

  if (enableFunErr) {
    randomProgrammerMemes();
  }

  vehicleCodeInit();
  findShowroomCode();
  nextGenCodes();
})();
