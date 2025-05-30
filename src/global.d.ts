type EnvTypes = "live" | "perf" | "prod" | "editor.html" | "cf#" | "jira";

type ColorProps = "info" | "success" | "warning" | "error";

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
