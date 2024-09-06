import React, { ComponentProps, MouseEvent } from "react";
import { Async } from "react-async";
import { Alert, Button, Loading } from "react-daisyui";
import { FaGithub } from "react-icons/fa";
import { IoSettingsOutline } from "react-icons/io5";
import { runtime, tabs, Tabs, webNavigation } from "webextension-polyfill";
import { create } from "zustand";
import UploadJsonFile from "../../containers/UploadJsonFile";
import {
  classic,
  ColorProps,
  EnvTypes,
  EnvTypesExtended,
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
  MessageAlert,
  MessageEnv,
  regexAuthor,
  SubjectTypes,
  touch,
} from "../../shared";

const regexCopyContent = /\/content.+(?=\.html)/;

export async function getPropertiesPath(): Promise<string> {
  const data = await getLocalSavedData();
  return data.secretSettings.propertiesPath;
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

type BtnSubjectType =
  | "toEnvironment"
  | "createWF"
  | "openInTree"
  | "checkReferences"
  | "checkMothersite";

interface ButtonEnvType extends ComponentProps<typeof Button> {
  anyEnv: boolean;
  customEnv: boolean;
  butEnv?: EnvTypesExtended;
  butSubject?: BtnSubjectType;
  butSendAs?: "runtime" | "tab";
}

function ButtonEnv({
  anyEnv,
  customEnv,
  children,
  ...props
}: Readonly<ButtonEnvType>) {
  if (!anyEnv || customEnv) {
    return false;
  }

  return <Button {...props}>{children}</Button>;
}

async function buttonOnClick(event: MouseEvent<HTMLButtonElement>) {
  const but: HTMLButtonElement = event.currentTarget;

  const sendAs: string | null = but.getAttribute("butsendas");
  if (!sendAs) {
    throw new Error("butsendas is undefined");
  }

  const activeTabs: Tabs.Tab[] = await tabs.query({
    highlighted: true,
    currentWindow: true,
  });

  let tabId = activeTabs[activeTabs.length - 1].id;
  if (!tabId) {
    throw new Error(`tabId is ${tabId}`);
  }

  const frames = await webNavigation.getAllFrames({ tabId });
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
    env: but.getAttribute("butenv") as EnvTypes,
    subject: but.getAttribute("butsubject") as SubjectTypes,
    tabs: activeTabs,
  };

  if (sendAs === "tab") {
    tabs.sendMessage(tabId, message);
  } else {
    runtime.sendMessage(message);
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

  tabs.create({
    url: newUrl,
    index: tab.index + 1,
  });
}

type InitVariablesType = {
  tabUrl: string;
  ifAnyOfTheEnvCache: boolean;
  ifAuthorCache: boolean;
  ifClassicCache: boolean;
  ifJiraCache: boolean;
  ifLiveCache: boolean;
  ifPerfCache: boolean;
  ifProdCache: boolean;
  ifTouchCache: boolean;
  fileUploaded: boolean;
};

async function initVariables(): Promise<InitVariablesType> {
  const { url } = await getCurrentTab();
  if (!url) {
    throw new Error("url is undefined");
  }

  let ifAnyOfTheEnvCache = false;
  let ifAuthorCache = false;
  let ifClassicCache = false;
  let ifJiraCache = false;
  let ifLiveCache = false;
  let ifPerfCache = false;
  let ifProdCache = false;
  let ifTouchCache = false;

  let fileUploaded = true;

  try {
    ifAnyOfTheEnvCache = await ifAnyOfTheEnv(url);
    ifAuthorCache = await ifAuthor(url);
    ifClassicCache = await ifClassic(url);
    ifJiraCache = await ifJira(url);
    ifLiveCache = await ifLive(url);
    ifPerfCache = await ifPerf(url);
    ifProdCache = await ifProd(url);
    ifTouchCache = await ifTouch(url);
  } catch (err) {
    fileUploaded = false;
  }

  return {
    tabUrl: url,
    fileUploaded,
    ifAnyOfTheEnvCache,
    ifAuthorCache,
    ifClassicCache,
    ifJiraCache,
    ifLiveCache,
    ifPerfCache,
    ifProdCache,
    ifTouchCache,
  };
}

runtime.onMessage.addListener(function (
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
  const { alertProps } = useStateAlert();

  return (
    <Async promiseFn={initVariables}>
      <Async.Pending>
        <div className="grid h-44 place-items-center">
          <Loading />
        </div>
      </Async.Pending>
      <Async.Fulfilled>
        {({
          tabUrl,
          fileUploaded,
          ifAnyOfTheEnvCache,
          ifJiraCache,
          ifLiveCache,
          ifPerfCache,
          ifProdCache,
          ifTouchCache,
          ifClassicCache,
          ifAuthorCache,
        }: InitVariablesType) => (
          <div>
            {fileUploaded ? (
              <>
                <div className="mb-3 hidden place-content-center gap-2 has-[button]:flex">
                  <ButtonEnv
                    anyEnv={true}
                    customEnv={!ifJiraCache}
                    butSubject="createWF"
                    butSendAs="tab"
                    size="md"
                    color="accent"
                    onClick={buttonOnClick}
                  >
                    Create WF
                  </ButtonEnv>
                </div>

                <div className="my-3 hidden place-content-center gap-2 has-[button]:flex">
                  <ButtonEnv
                    anyEnv={ifAnyOfTheEnvCache}
                    customEnv={ifLiveCache}
                    butEnv="live"
                    butSubject="toEnvironment"
                    butSendAs="runtime"
                    size="md"
                    color="success"
                    onClick={buttonOnClick}
                    onAuxClick={buttonOnClick}
                  >
                    To Live
                  </ButtonEnv>

                  <ButtonEnv
                    anyEnv={ifAnyOfTheEnvCache}
                    customEnv={ifPerfCache}
                    butEnv="perf"
                    butSubject="toEnvironment"
                    butSendAs="runtime"
                    size="md"
                    color="info"
                    onClick={buttonOnClick}
                    onAuxClick={buttonOnClick}
                  >
                    To Perf
                  </ButtonEnv>

                  <ButtonEnv
                    anyEnv={ifAnyOfTheEnvCache}
                    customEnv={ifProdCache}
                    butEnv="prod"
                    butSubject="toEnvironment"
                    butSendAs="runtime"
                    size="md"
                    color="warning"
                    onClick={buttonOnClick}
                    onAuxClick={buttonOnClick}
                  >
                    To Prod
                  </ButtonEnv>

                  <ButtonEnv
                    anyEnv={ifAnyOfTheEnvCache}
                    customEnv={ifTouchCache}
                    butEnv={touch}
                    butSubject="toEnvironment"
                    butSendAs="runtime"
                    size="md"
                    color="accent"
                    onClick={buttonOnClick}
                    onAuxClick={buttonOnClick}
                  >
                    To Touch
                  </ButtonEnv>

                  <ButtonEnv
                    anyEnv={ifAnyOfTheEnvCache}
                    customEnv={ifClassicCache}
                    butEnv={classic}
                    butSubject="toEnvironment"
                    butSendAs="runtime"
                    size="md"
                    color="error"
                    onClick={buttonOnClick}
                    onAuxClick={buttonOnClick}
                  >
                    To Classic
                  </ButtonEnv>
                </div>

                <div className="my-3 hidden flex-wrap place-content-center gap-2 has-[button]:flex">
                  <hr className="my-1 h-px w-full border-0 bg-gray-200" />
                  <ButtonEnv
                    anyEnv={ifAnyOfTheEnvCache}
                    customEnv={!ifAuthorCache}
                    size="md"
                    color="secondary"
                    onClick={() => copyContent(tabUrl)}
                  >
                    Copy Content
                  </ButtonEnv>

                  <ButtonEnv
                    anyEnv={ifAnyOfTheEnvCache}
                    customEnv={!ifAuthorCache}
                    size="md"
                    color="accent"
                    onClick={openPropertiesTouchUI}
                  >
                    Open Properties Touch UI
                  </ButtonEnv>

                  <ButtonEnv
                    anyEnv={ifAnyOfTheEnvCache}
                    customEnv={!ifAuthorCache}
                    butSubject="openInTree"
                    butSendAs="runtime"
                    size="md"
                    color="success"
                    onClick={buttonOnClick}
                  >
                    Open In Tree
                  </ButtonEnv>

                  <ButtonEnv
                    anyEnv={ifAnyOfTheEnvCache}
                    customEnv={!ifAuthorCache}
                    butSubject="checkReferences"
                    butSendAs="tab"
                    size="md"
                    color="error"
                    onClick={buttonOnClick}
                  >
                    Check references
                  </ButtonEnv>

                  <ButtonEnv
                    anyEnv={ifAnyOfTheEnvCache}
                    customEnv={ifAuthorCache}
                    butSubject="checkMothersite"
                    butSendAs="tab"
                    size="md"
                    color="success"
                    onClick={buttonOnClick}
                  >
                    Check mothersite links
                  </ButtonEnv>
                </div>

                {alertProps && (
                  <Alert
                    className="animate-fade duration-75"
                    status={alertProps.color}
                  >
                    {alertProps.text}
                  </Alert>
                )}
              </>
            ) : (
              <UploadJsonFile />
            )}

            <div className="mt-10 flex place-content-between gap-2">
              <Button
                color="neutral"
                tag="a"
                href="/src/pages/options/index.html"
                size="sm"
              >
                <IoSettingsOutline className="mr-2 h-5 w-5" />
                Options
              </Button>

              <Button
                color="neutral"
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
        )}
      </Async.Fulfilled>
      <Async.Rejected>
        {(error) => `Something went wrong: ${error.message}`}
      </Async.Rejected>
    </Async>
  );
}
