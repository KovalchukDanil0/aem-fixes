export interface TourProps {
  toEnvironmentLive: boolean;
  toEnvironmentPerf: boolean;
  toEnvironmentProd: boolean;
  toEnvironmentCf: boolean;
  toEnvironmentEditorHtml: boolean;
}

interface SyncData {
  disCreateWf: boolean;
  disMothersiteCheck: boolean;
  enableAutoLogin: boolean;
  enableFilterFix: boolean;
  enableFunErr: boolean;
  posthog_distinct_id: string;
  tourSettings: TourProps | null;
}
export type SavedSyncData = Partial<SyncData>;

interface LocalData {
  wfTitle: string | null;
  wfName: string | null;
}
export type SavedLocalData = Partial<LocalData>;

export const livePerfMatch = import.meta.env.VITE_LIVE_PERF_MATCH.split(", ");
export const wfPageMatch = [import.meta.env.VITE_WF_PAGE_MATCH];
export const jiraMatch = [import.meta.env.VITE_JIRA_MATCH];
export const authorMatch = [import.meta.env.VITE_AUTHOR_MATCH];
export const aemToolsMatch = [import.meta.env.VITE_AEM_TOOLS_MATCH];
export const damTreeMatch = [import.meta.env.VITE_DAM_TREE_MATCH];
export const findReplaceMatch = [import.meta.env.VITE_FIND_REPLACE_MATCH];

export const regexWorkflow = RegExp(import.meta.env.VITE_REGEX_WORKFLOW);
export const regexDAMTree = RegExp(import.meta.env.VITE_REGEX_DAM_TREE);
export const regexLive = RegExp(import.meta.env.VITE_REGEX_LIVE);
export const regexPerfProd = RegExp(import.meta.env.VITE_REGEX_PERF_PROD);
export const regexAuthor = RegExp(import.meta.env.VITE_REGEX_AUTHOR);
export const regexDetermineBeta = RegExp(
  import.meta.env.VITE_REGEX_DETERMINE_BETA,
);
export const regexFastAuthor = RegExp(import.meta.env.VITE_REGEX_FAST_AUTHOR);
export const regexFixSiteWide = RegExp(
  import.meta.env.VITE_REGEX_FIX_SITE_WIDE,
);
export const regexWFTitle = RegExp(import.meta.env.VITE_REGEX_WF_TITLE);
export const regexImagePicker = RegExp(import.meta.env.VITE_REGEX_IMAGE_PICKER);
export const regexHTMLExist = RegExp(import.meta.env.VITE_REGEX_HTML_EXIST);
export const domain = import.meta.env.VITE_DOMAIN;
export const pathToResolver = import.meta.env.VITE_PATH_TO_RESOLVER;
export const pathToReferences = import.meta.env.VITE_PATH_TO_REFERENCES;
export const pathToReferencesParams = import.meta.env
  .VITE_PATH_TO_REFERENCES_PARAMS;
export const topLevelDomain = import.meta.env.VITE_DOMAIN_TOP_LEVEL;
export const domainPerf = import.meta.env.VITE_DOMAIN_PERF;
export const domainProd = import.meta.env.VITE_DOMAIN_PROD;
export const workflowPath = import.meta.env.VITE_WORKFLOW_PATH;
export const fullAuthorPath = import.meta.env.VITE_FULL_AUTHOR_PATH;
export const propertiesPath = import.meta.env.VITE_PROPERTIES_PATH;
export const jiraFullPath = import.meta.env.VITE_JIRA_FULL_PATH;

export const secretWord = (country: string) =>
  `${import.meta.env.VITE_SECRET_WORD} ${country}`;

export const isLive = (url?: string) => url && regexLive.test(url);
export const isPerf = (url?: string) =>
  url?.replace(regexPerfProd, "$1") === "perf";
export const isProd = (url?: string) =>
  url?.replace(regexPerfProd, "$1") === "prod";
export const isAuthor = (url?: string) => url && regexAuthor.test(url);
export const isTouch = (url?: string) =>
  url?.replace(regexAuthor, "$2") === "editor.html";

export const loadSavedData = async () =>
  browser.storage.sync.get<SavedSyncData>({
    disCreateWf: false,
    disMothersiteCheck: false,
    enableFunErr: false,
    enableFilterFix: false,
    enableAutoLogin: false,
  });
