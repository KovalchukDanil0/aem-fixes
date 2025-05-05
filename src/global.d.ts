interface SavedSyncData {
  disCreateWF?: boolean;
  disMothersiteCheck?: boolean;
  enableAutoLogin?: boolean;
  enableFilterFix?: boolean;
  enableFunErr?: boolean;
}

interface SavedLocalData {
  WFTitle?: string;
  WFName?: string;
}

type SubjectTypes =
  | "getEnvironment"
  | "checkReferences"
  | "getRealUrl"
  | "toEnvironment"
  | "showMessage"
  | "openInTree"
  | "createWF"
  | "checkMothersite"
  | "getCookie"
  | "showShowroomConfig";

type FromType = "popup" | "background" | "content";

type ColorProps = "info" | "success" | "warning" | "error";

type EnvTypesExtended =
  | "live"
  | "perf"
  | "prod"
  | "editor.html"
  | "cf#"
  | "jira";

interface MessageCommon {
  from: FromType;
  subject: SubjectTypes | null;
  url?: string;
}

interface MessageRealPerf extends MessageCommon {
  html: Document | null;
}

interface MessageEnv extends MessageCommon {
  env: EnvTypesExtended;
  tabs: Tabs.Tab[];
  newTab: boolean;
}

interface MessageAlert extends MessageCommon {
  text: string;
  color: ColorProps;
}

interface ShowroomCode {
  data: Record<
    string,
    {
      code: string;
      name: string;
    }
  >;
}

interface ReferencesConfig {
  pages: {
    path: string;
  }[];
}

interface EventHandler<T> extends MouseEvent {
  currentTarget: EventTarget & T;
}

type MemeResponseType = Record<string, { path: string }>;
