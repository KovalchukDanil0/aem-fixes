import { ComponentProps, MouseEvent, ReactElement } from "react";
import { Async } from "react-async";
import { Alert, Button, Loading } from "react-daisyui";
import { FaCog, FaGithub } from "react-icons/fa";
import UploadJsonFile from "src/components/UploadJsonFile";
import {
  getFullAuthorPath,
  getLocalSavedData,
  getRegexAuthor,
  ifAnyOfTheEnv,
  ifAuthor,
  ifAuthorNoEnv,
  ifClassic,
  ifJira,
  ifLive,
  ifPerf,
  ifProd,
  ifTouch,
} from "src/lib/storage";
import { findAsyncSequential, getCurrentTab } from "src/lib/tools";
import {
  ColorProps,
  EnvTypesExtended,
  MessageAlert,
  MessageEnv,
  SubjectTypes,
} from "src/lib/types";
import { runtime, tabs, Tabs, webNavigation } from "webextension-polyfill";
import { create } from "zustand";
import "./index.scss";

const regexCopyContent = /\/content.+(?=\.html)/;

let isFileUploaded = true;

type AlertProps = {
  text?: string;
  color?: ColorProps;
};

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

async function getPropertiesPath(): Promise<string> {
  const {
    secretSettings: { propertiesPath },
  } = await getLocalSavedData();
  return propertiesPath;
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
};

const useStateAlert = create<{
  alertProps: AlertProps | null;
  setAlertProps: (alertProps: AlertProps) => void;
}>((set) => ({
  alertProps: null,
  setAlertProps: ({ text, color }) =>
    set(() => ({ alertProps: { text, color } })),
}));

async function copyContent(url: string): Promise<void> {
  const content: string | undefined = regexCopyContent.exec(url)?.[0];
  if (!content) {
    throw new Error(`copied content is ${content}`);
  }

  navigator.clipboard.writeText(content);

  useStateAlert.setState({
    alertProps: { text: `${content} copied to clipboard`, color: "info" },
  });
}

function ButtonEnv({
  anyEnv,
  customEnv,
  ...props
}: Readonly<ButtonEnvType>): ReactElement {
  if (!anyEnv || customEnv) {
    return <></>;
  }

  return <Button {...props} />;
}

async function buttonOnClick({
  currentTarget,
  type,
}: MouseEvent<HTMLButtonElement>): Promise<void> {
  const sendAs = currentTarget.getAttribute("butsendas");
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
    const conditionFound = await findAsyncSequential(frames, ({ url }) =>
      ifAuthorNoEnv(url),
    );

    if (conditionFound?.tabId) {
      tabId = conditionFound.tabId;
    }
  }

  const message: MessageEnv = {
    from: "popup",
    newTab: type !== "click",
    env: currentTarget.getAttribute("butenv") as EnvTypesExtended,
    subject: currentTarget.getAttribute("butsubject") as SubjectTypes,
    tabs: activeTabs,
  };

  if (sendAs === "tab") {
    tabs.sendMessage(tabId, message);
  } else {
    runtime.sendMessage(message);
  }
}

async function openPropertiesTouchUI(): Promise<void> {
  const { url, index }: Tabs.Tab = await getCurrentTab();
  const fullAuthorPath = await getFullAuthorPath();
  const propertiesPath = await getPropertiesPath();

  const newUrl = url?.replace(
    await getRegexAuthor(),
    `https://${fullAuthorPath}/${propertiesPath}`,
  );

  tabs.create({
    url: newUrl,
    index: index + 1,
  });
}

function setFileUploaded(): boolean {
  isFileUploaded = false;
  return isFileUploaded;
}

async function initVariables(): Promise<InitVariablesType> {
  const { url: tabUrl } = await getCurrentTab();
  if (!tabUrl) {
    throw new Error("url is undefined");
  }

  const ifAnyOfTheEnvCache = await ifAnyOfTheEnv(tabUrl).catch(setFileUploaded);
  const ifAuthorCache = await ifAuthor(tabUrl).catch(setFileUploaded);
  const ifClassicCache = await ifClassic(tabUrl).catch(setFileUploaded);
  const ifJiraCache = await ifJira(tabUrl).catch(setFileUploaded);
  const ifLiveCache = await ifLive(tabUrl).catch(setFileUploaded);
  const ifPerfCache = await ifPerf(tabUrl).catch(setFileUploaded);
  const ifProdCache = await ifProd(tabUrl).catch(setFileUploaded);
  const ifTouchCache = await ifTouch(tabUrl).catch(setFileUploaded);

  return {
    tabUrl,
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

runtime.onMessage.addListener(function ({
  from,
  color,
  message: text,
  subject,
}: MessageAlert): void {
  if (from === "popup") {
    return;
  }

  if (subject === "showMessage") {
    useStateAlert.setState({
      alertProps: { text, color },
    });
  }
});

export default function Popup(): ReactElement {
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
          ifAnyOfTheEnvCache,
          ifJiraCache,
          ifLiveCache,
          ifPerfCache,
          ifProdCache,
          ifTouchCache,
          ifClassicCache,
          ifAuthorCache,
        }: InitVariablesType) => (
          <div className="flex flex-col gap-5">
            {isFileUploaded ? (
              <>
                <div className="hidden place-content-center has-[button]:flex">
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

                <div className="hidden place-content-center gap-2 has-[button]:flex">
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
                    butEnv={"editor.html"}
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
                    butEnv={"cf#"}
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

                <div className="hidden flex-wrap place-content-center gap-2 has-[button]:flex">
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

            <div className="mt-auto flex place-content-between gap-2">
              <Button
                color="neutral"
                tag="a"
                href="/src/pages/options/index.html"
                size="sm"
              >
                <FaCog className="mr-2 h-5 w-5" />
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
