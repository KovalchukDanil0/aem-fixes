import type { EventName, Properties } from "posthog-js/dist/module.no-external";

export interface PostHogProps {
  postHogEvent?: EventName;
  postHogConfig?: Properties;
}
