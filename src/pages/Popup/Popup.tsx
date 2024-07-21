import React, { useTransition } from "react";
import { useAsync } from "react-async";
import { Alert, Button, Loading } from "react-daisyui";
import { FaGithub } from "react-icons/fa";
import { IoSettingsOutline } from "react-icons/io5";
import Browser, { Tabs } from "webextension-polyfill";
import { create } from "zustand";
import UploadJsonFile from "../../containers/UploadJsonFile";
import {
  ColorProps,
  EnvTypes,
  MessageAlert,
  MessageEnv,
  SubjectTypes,
  classic,
  findAsyncSequential,
  getCurrentTab,
  getFullAuthorPath,
  getLocalSavedData,
  ifAnyOfTheEnv,
  ifAuthor,
  ifAuthorNoEnv,
  ifClassic,
  ifJira,
  ifLive,
  ifPerf,
  ifProd,
  ifTouch,
  regexAuthor,
  touch,
} from "../../shared";

let ifAnyOfTheEnvCache = false;
let ifAuthorCache = false;
let ifClassicCache = false;
let ifJiraCache = false;
let ifLiveCache = false;
let ifPerfCache = false;
let ifProdCache = false;
let ifTouchCache = false;

let fileUploaded = true;

const regexCopyContent = /\/content.+(?=\.html)/;

type ButtonProps = {
  url: string;
};

export async function getPropertiesPath(): Promise<string> {
  const data = await getLocalSavedData();
  return data.secretSettings.propertiesPath;
}

async function cacheVariables(url: string | undefined) {
  if (!url) {
    return;
  }

  try {
    ifAnyOfTheEnvCache = await ifAnyOfTheEnv(url);
    ifAuthorCache = await ifAuthor(url);
    ifClassicCache = await ifClassic(url);
    ifJiraCache = await ifJira(url);
    ifLiveCache = await ifLive(url);
    ifPerfCache = await ifPerf(url);
    ifProdCache = await ifProd(url);
    ifTouchCache = await ifTouch(url);
  } catch {
    fileUploaded = false;
  }
}

type AlertProps = {
  text: string | undefined;
  color: ColorProps | undefined;
};

const useStateAlert = create<{
  alertProps: AlertProps | null;
  setAlertProps: (alertProps: AlertProps) => void;
}>((set) => ({
  alertProps: null,
  setAlertProps: (alertProps) =>
    set(() => ({
      alertProps: { text: alertProps.text, color: alertProps.color },
    })),
}));

function ButtonCreateWF() {
  if (!ifJiraCache) {
    return false;
  }

  return (
    <Button
      but-subject="createWF"
      but-send-as="tab"
      size="md"
      color="accent"
      id="buttonCreateWF"
      onClick={buttonOnClick}
    >
      Create WF
    </Button>
  );
}

function ButtonToLive() {
  if (!ifAnyOfTheEnvCache || ifLiveCache) {
    return false;
  }

  return (
    <Button
      but-env="live"
      but-subject="toEnvironment"
      but-send-as="runtime"
      size="md"
      id="buttonToLive"
      color="success"
      onClick={buttonOnClick}
      onAuxClick={buttonOnClick}
    >
      To Live
    </Button>
  );
}

function ButtonToPerf() {
  const [isPending, startTransition] = useTransition();

  if (!ifAnyOfTheEnvCache || ifPerfCache) {
    return false;
  }

  function pendingFunction(event: React.MouseEvent<HTMLButtonElement>) {
    startTransition(() => {
      buttonOnClick(event);
    });
  }

  return (
    <Button
      but-env="perf"
      but-subject="toEnvironment"
      but-send-as="runtime"
      size="md"
      id="buttonToPerf"
      color="info"
      onClick={pendingFunction}
      onAuxClick={pendingFunction}
    >
      To Perf {isPending && <Loading />}
    </Button>
  );
}

function ButtonToProd() {
  if (!ifAnyOfTheEnvCache || ifProdCache) {
    return false;
  }

  return (
    <Button
      but-env="prod"
      but-subject="toEnvironment"
      but-send-as="runtime"
      size="md"
      id="buttonToProd"
      color="warning"
      onClick={buttonOnClick}
      onAuxClick={buttonOnClick}
    >
      To Prod
    </Button>
  );
}

function ButtonToTouch() {
  const [isPending, startTransition] = useTransition();

  if (!ifAnyOfTheEnvCache || ifTouchCache) {
    return false;
  }

  function pendingFunction(event: React.MouseEvent<HTMLButtonElement>) {
    startTransition(() => {
      buttonOnClick(event);
    });
  }

  return (
    <Button
      but-env={touch}
      but-subject="toEnvironment"
      but-send-as="runtime"
      size="md"
      id="buttonToTouch"
      color="accent"
      onClick={pendingFunction}
      onAuxClick={pendingFunction}
    >
      To Touch {isPending && <Loading />}
    </Button>
  );
}

function ButtonToClassic() {
  if (!ifAnyOfTheEnvCache || ifClassicCache) {
    return false;
  }

  return (
    <Button
      but-env={classic}
      but-subject="toEnvironment"
      but-send-as="runtime"
      size="md"
      id="buttonToClassic"
      color="error"
      onClick={buttonOnClick}
      onAuxClick={buttonOnClick}
    >
      To Classic
    </Button>
  );
}

async function copyContent(url: string) {
  const content: string | undefined = regexCopyContent.exec(url)?.[0];

  if (!content) {
    throw new Error(`copied content is ${content}`);
  }

  navigator.clipboard.writeText(content);

  useStateAlert.setState({
    alertProps: { text: `${content} copied to clipboard`, color: "info" },
  });
}

function ButtonCopyContent({ url }: Readonly<ButtonProps>) {
  if (!ifAnyOfTheEnvCache || !ifAuthorCache) {
    return false;
  }

  return (
    <Button
      size="md"
      id="buttonCopyContent"
      color="secondary"
      onClick={() => copyContent(url)}
    >
      Copy Content
    </Button>
  );
}

function ButtonOpenPropertiesTouchUI() {
  if (!ifAnyOfTheEnvCache || !ifAuthorCache) {
    return false;
  }

  return (
    <Button
      size="md"
      id="buttonOpenPropertiesTouchUI"
      color="accent"
      onClick={openPropertiesTouchUI}
    >
      Open Properties Touch UI
    </Button>
  );
}

function ButtonOpenInTree() {
  if (!ifAnyOfTheEnvCache || !ifAuthorCache) {
    return false;
  }

  return (
    <Button
      but-subject="openInTree"
      but-send-as="runtime"
      size="md"
      id="buttonOpenInTree"
      color="success"
      onClick={buttonOnClick}
    >
      Open In Tree
    </Button>
  );
}

function ButtonCheckReferences() {
  if (!ifAnyOfTheEnvCache || !ifAuthorCache) {
    return false;
  }

  return (
    <Button
      but-subject="checkReferences"
      but-send-as="tab"
      size="md"
      id="buttonCheckReferences"
      color="error"
      onClick={buttonOnClick}
    >
      Check references
    </Button>
  );
}

function ButtonCheckMothersite() {
  if (!ifAnyOfTheEnvCache || ifAuthorCache) {
    return false;
  }

  return (
    <Button
      but-subject="checkMothersite"
      but-send-as="tab"
      size="md"
      id="buttonCheckMothersite"
      color="success"
      onClick={buttonOnClick}
    >
      Check mothersite links
    </Button>
  );
}

async function buttonOnClick(event: React.MouseEvent<HTMLButtonElement>) {
  const but: HTMLButtonElement = event.currentTarget;

  const sendAs: string | null = but.getAttribute("but-send-as");
  if (!sendAs) {
    throw new Error("but-send-as is undefined");
  }

  const tabs: Tabs.Tab[] = await Browser.tabs.query({
    highlighted: true,
    currentWindow: true,
  });

  let tabId = tabs[tabs.length - 1].id;
  if (!tabId) {
    throw new Error(`tabId is ${tabId}`);
  }

  const frames = await Browser.webNavigation.getAllFrames({ tabId });
  if (frames) {
    const conditionFound = await findAsyncSequential(frames, (frame) =>
      ifAuthorNoEnv(frame.url),
    );

    if (conditionFound?.tabId) {
      tabId = conditionFound.tabId;
    }
  }

  const message: MessageEnv = {
    from: "popup",
    newTab: event.type !== "click",
    env: but.getAttribute("but-env") as EnvTypes,
    subject: but.getAttribute("but-subject") as SubjectTypes,
    tabs,
  };

  if (sendAs === "tab") {
    Browser.tabs.sendMessage(tabId, message);
  } else {
    Browser.runtime.sendMessage(message);
  }
}

async function openPropertiesTouchUI() {
  const tab: Tabs.Tab = await getCurrentTab();
  const fullAuthorPath = await getFullAuthorPath();
  const propertiesPath = await getPropertiesPath();

  const newUrl: string | undefined = tab.url?.replace(
    await regexAuthor(),
    `https://${fullAuthorPath}/${propertiesPath}`,
  );

  Browser.tabs.create({
    url: newUrl,
    index: tab.index + 1,
  });
}

async function initVariables(): Promise<string | undefined> {
  const url = (await getCurrentTab()).url;
  await cacheVariables(url);

  return url;
}

Browser.runtime.onMessage.addListener(function (
  msg: MessageAlert,
  _sender,
  _sendResponse,
) {
  if (msg.from === "popup") {
    return;
  }

  if (msg.subject === "showMessage") {
    useStateAlert.setState({
      alertProps: { text: msg.message, color: msg.color },
    });
  }
});

export default function Popup() {
  const {
    data: tabUrl,
    error,
    isPending,
  } = useAsync({ promiseFn: initVariables });

  const { alertProps } = useStateAlert();

  if (isPending) {
    return (
      <div className="grid h-44 place-items-center">
        <Loading />
      </div>
    );
  }

  if (error || !tabUrl) {
    return `Something went wrong: ${error?.message ?? "tabUrl is undefined"}`;
  }

  return (
    <div>
      {!fileUploaded && <UploadJsonFile />}

      <div className="mb-3 hidden place-content-center gap-2 has-[button]:flex">
        <ButtonCreateWF />
      </div>

      <div className="my-3 hidden place-content-center gap-2 has-[button]:flex">
        <ButtonToLive />
        <ButtonToPerf />
        <ButtonToProd />
        <ButtonToTouch />
        <ButtonToClassic />
      </div>

      <div className="my-3 hidden flex-wrap place-content-center gap-2 has-[button]:flex">
        <hr className="my-1 h-px w-full border-0 bg-gray-200" />

        <ButtonCopyContent url={tabUrl} />
        <ButtonOpenPropertiesTouchUI />
        <ButtonOpenInTree />
        <ButtonCheckReferences />
        <ButtonCheckMothersite />
      </div>

      {alertProps && (
        <Alert className="animate-fade duration-75" status={alertProps.color}>
          {alertProps.text}
        </Alert>
      )}

      <div className="mt-10 flex place-content-between gap-2">
        <Button tag="a" href="options.html" size="sm">
          <IoSettingsOutline className="mr-2 h-5 w-5" />
          Options
        </Button>

        <Button
          tag="a"
          href="https://github.com/KovalchukDanil0/AEMFixes#features"
          target="_blank"
          size="sm"
        >
          <FaGithub className="mr-2 h-5 w-5" />
          See Guide
        </Button>
      </div>
    </div>
  );
}
