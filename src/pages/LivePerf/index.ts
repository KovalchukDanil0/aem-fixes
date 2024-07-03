import axios, { AxiosResponse } from "axios";
import axiosRetry from "axios-retry";
import { ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { el, mount } from "redom";
import Browser, { Runtime } from "webextension-polyfill";
import ShowroomCodes from "../../containers/ShowroomCodes";
import {
  FromTypes,
  MessageAlert,
  MessageCommon,
  ShowroomCode,
  loadSavedData,
  regexAuthor,
  waitForElm,
} from "../../shared";
import "./index.scss";

const url: Location = window.location;

let wizardConfig: HTMLElement;
let wizardVehicleSelector: HTMLElement | null;

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

let vehicleConfig: VehicleConfig;
let lastVehicleIndex = -1;

axiosRetry(axios, {
  retries: 3,

  retryDelay: (retryCount) => {
    console.log(`retry attempt: ${retryCount}`);
    return retryCount * 2000;
  },

  retryCondition: (error) => {
    // if retry condition is not specified, by default idempotent requests are retried
    return error.response?.status === 503;
  },
});

async function randomProgrammerMemes() {
  if (document.title !== "404") {
    return;
  }

  const githubPath =
    "https://raw.githubusercontent.com/deep5050/programming-memes/main/";

  const data = (await axios.get(githubPath + "memes.json")).data;
  const count = Object.keys(data).length;

  //Extracting data
  const memeImage = data[generateRandom(count - 1)].path;

  const billboardContainer: HTMLElement | null = document.querySelector(
    "#accelerator-page > div.content > div > div.box-content.cq-dd-image > div > div.billboard.billboard-image-sets-height > div > div.billboard-inner," +
      "#global-ux > div.content.clearfix > div:nth-child(1) > div.billboard.section > div > div.billboard-inner",
  );

  const billboardImages: HTMLElement | null | undefined =
    billboardContainer?.querySelector("div > picture");

  const billboardText: HTMLElement | null | undefined =
    billboardContainer?.querySelector("div.billboard-paragraph");

  billboardText?.remove();

  (billboardImages?.childNodes as NodeListOf<HTMLSourceElement>).forEach(
    (image) => {
      image.srcset = githubPath + memeImage;
    },
  );
}

function generateRandom(maxLimit: number) {
  let rand = Math.random() * maxLimit;
  rand = Math.floor(rand);

  return rand;
}

async function checkMothersite(from: FromTypes) {
  if (url.href.replace(await regexAuthor(), "$4") === "mothersite") {
    return;
  }

  const links: NodeListOf<HTMLLinkElement> =
    document.querySelectorAll("[href]");

  let mothersiteLinks = 0;
  links.forEach((element) => {
    if (element.href.includes("mothersite")) {
      element.style.backgroundColor = "blue";
      element.style.filter = "invert(100%)";

      mothersiteLinks += 1;
    }
  });

  const message = `MOTHERSITE LINKS ON THIS PAGE - ${mothersiteLinks}`;

  if (mothersiteLinks > 0 && from === "content") {
    const vehicleCodeElm: HTMLElement = el(
      "div.alertBanner",
      el("h2.alertBannerHeadline", { textContent: message }),
    );

    const firstChild = document.body.firstChild;
    if (!firstChild) {
      throw new Error("Document has no children");
    }

    mount(document.body, vehicleCodeElm, firstChild);
  } else {
    Browser.runtime.sendMessage({
      message,
      from: "content",
      subject: "showMessage",
      color: mothersiteLinks === 0 ? "success" : "error",
    } as MessageAlert);
  }
}

const getCarByName = (data: CarProps[], value: string | undefined): CarProps =>
  data.filter((elm) => elm.desc === value)[0];

async function vehicleCodeInit() {
  const wizardWindow = "div.wizard.initialized-wizard.ng-scope > ";

  wizardConfig = await waitForElm(wizardWindow + "span.configuration");

  await waitForElm(
    wizardWindow +
      "div.ng-scope > div > div.steps-wrapper.full-view > div.wizard-vehicle-selector.ng-scope > div.vehicle-list > figure:nth-child(1)",
  );

  wizardVehicleSelector = document.querySelector(".wizard-vehicle-selector");

  const buttonContainer: HTMLElement | null | undefined =
    wizardVehicleSelector?.querySelector(
      "div.category-buttons > div.category-buttons-container",
    );

  const butContChildren = buttonContainer?.children;
  if (butContChildren) {
    for (let index = 0; index < butContChildren.length; index++) {
      const but = butContChildren[index];
      but.addEventListener("click", () => findVehicleCode(index));
    }
  }

  findVehicleCode();
}

async function findVehicleCode(idx = 0) {
  if (lastVehicleIndex === idx) {
    return;
  }

  lastVehicleIndex = idx;

  if (!vehicleConfig) {
    const config = `${wizardConfig.getAttribute(
      "data-nameplate-service",
    )}/${wizardConfig.getAttribute(
      "data-campaign-code",
    )}/${wizardConfig.getAttribute("data-site-id")}/${wizardConfig.getAttribute(
      "data-event-type",
    )}?locale=${wizardConfig.getAttribute("data-culture-code")}`;

    const response = await axios
      .get(config, {
        headers: {
          Accept: "application/json",
        },
      })
      .catch((err) => {
        if (err.response.status !== 200) {
          throw new Error(
            `API call failed with status code: ${err.response.status} after 3 retry attempts`,
          );
        }
      });

    vehicleConfig = (response as AxiosResponse).data;
  }

  const allCars: NodeListOf<HTMLElement> | undefined =
    wizardVehicleSelector?.querySelectorAll(
      "div.vehicle-list > figure > div > figcaption > a:not(#carCode)",
    );

  allCars?.forEach((car) => {
    const carName = car.textContent?.trim();

    const carObj: CarProps = getCarByName(
      vehicleConfig.data[idx].eventItem,
      carName,
    );

    if (car.parentElement && carObj) {
      car.id = "carCode";

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

      const vehicleCodeElm: HTMLElement = el("a.carCodeElm", {
        href: "?vehicleCode=" + fullCode,
        textContent: fullCode,
      });
      mount(car.parentElement, vehicleCodeElm);
    }
  });
}

async function findShowroomCode() {
  const showroom = await waitForElm("#acc-showroom");

  const showroomElm = await waitForElm("#acc-showroom > span");

  const config: string | null = showroomElm.getAttribute("data-bsl-url");
  if (!config) {
    throw new Error("showroom config `data-bsl-url` is null");
  }

  const showroomConfig: ShowroomCode = (
    await axios.get(config, {
      headers: {
        Accept: "application/json",
      },
    })
  ).data;

  const showroomCodes: ReactElement = ShowroomCodes({
    data: showroomConfig.data,
  });

  const div: HTMLElement = document.createElement("div");
  const root = createRoot(showroom.appendChild(div));
  root.render(showroomCodes);
}

Browser.runtime.onMessage.addListener(
  (
    msg: MessageCommon,
    _sender: Runtime.MessageSender,
    _sendResponse: Function,
  ) => {
    if (msg.from === "popup" && msg.subject === "checkMothersite") {
      checkMothersite(msg.from);
    }
  },
);

(async function Main() {
  const savedData = await loadSavedData();

  if (!savedData.disMothersiteCheck) {
    checkMothersite("content");
  }

  if (savedData.enableFunErr) {
    randomProgrammerMemes();
  }

  vehicleCodeInit();
  findShowroomCode();
})();
