import { defineExtensionMessaging } from "@webext-core/messaging";
import { defineProxyService } from "@webext-core/proxy-service";

interface MessageCommon {
  url?: string;
}

interface MessageRealPerf extends MessageCommon {
  html: Document | null;
}

interface MessageTabs extends MessageCommon {
  tabs?: Browser.tabs.Tab[];
}

interface MessageEnv extends MessageTabs {
  env: EnvTypes;
  tabs: Browser.tabs.Tab[];
  newTab: boolean;
}

interface MessageAlert extends MessageCommon {
  text: string;
  color: ColorProps;
}

export interface ProtocolMap {
  getEnvironment(data: MessageCommon): EnvTypes | null;
  getRealUrl(data: MessageRealPerf): string | undefined;

  toEnvironment(data: MessageEnv): void;
  showMessage(data: MessageAlert): void;
  openInTree(data: MessageTabs): void;

  getCookie(): string | undefined;

  checkMothersite(): void;
  checkReferences(): void;
  createWF(): void;
  showShowroomConfig(): void;
}

export const { sendMessage, onMessage } =
  defineExtensionMessaging<ProtocolMap>();

class BackgroundService {
  async fibonacci(number: number): Promise<number> {
    return Promise.resolve(number);
  }
}
export const [registerBackgroundService, getBackgroundService] =
  defineProxyService("BackgroundService", () => new BackgroundService());
