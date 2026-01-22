import { defineExtensionMessaging } from "@webext-core/messaging";

interface MessageCommon {
  url?: string;
}

interface MessageTabs extends MessageCommon {
  tabs?: Browser.tabs.Tab[];
}

interface MessageEnv extends MessageTabs {
  env?: EnvTypes;
  tabs: Browser.tabs.Tab[];
  newTab: boolean;
}

interface MessageAlert extends MessageCommon {
  text: string;
  color: ColorProps;
}

export interface ProtocolMap {
  getEnvironment(data: MessageCommon): EnvTypes | null;
  getRealUrl(): string | undefined;

  toEnvironment(data: MessageEnv): void;
  showMessage(data: MessageAlert): void;
  openInTree(data: MessageTabs): void;

  getCookie(): string | undefined;

  injectMothersiteCss(): void;
  checkMothersite(): void;
  checkReferences(): void;
  createWF(): void;
  showShowroomConfig(): void;

  getUrlPageTag(data: { pageTag: string }): string;
}

export const { sendMessage, onMessage } =
  defineExtensionMessaging<ProtocolMap>();
