import { Tabs } from "webextension-polyfill";

export type SavedSyncData = {
  disCreateWF?: boolean;
  disMothersiteCheck?: boolean;
  enableAutoLogin?: boolean;
  enableFilterFix?: boolean;
  enableFunErr?: boolean;
};

export type SubjectTypes =
  | "checkReferences"
  | "getRealUrl"
  | "toEnvironment"
  | "showMessage"
  | "openInTree"
  | "createWF"
  | "checkMothersite"
  | "getCookie";

export type FromTypes = "popup" | "background" | "content";

export type MessageCommon = {
  from: FromTypes;
  subject: SubjectTypes | null;
  url?: string;
};

export type EnvTypesExtended = "live" | "perf" | "prod" | "editor.html" | "cf#";
export interface MessageEnv extends MessageCommon {
  env: EnvTypesExtended;
  tabs: Tabs.Tab[];
  newTab: boolean;
}

export type ColorProps = "info" | "success" | "warning" | "error";
export interface MessageAlert extends MessageCommon {
  message: string;
  color: ColorProps;
}

export type ShowroomCode = {
  showroomConfig: {
    [key: string]: {
      code: string;
      name: string;
    };
  };
};

export interface ReferencesConfig {
  pages: {
    path: string;
  }[];
}
