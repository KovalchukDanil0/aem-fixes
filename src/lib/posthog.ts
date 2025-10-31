import posthog, {
  type PostHogConfig,
} from "posthog-js/dist/module.no-external";
import { v7 as uuidv7 } from "uuid";
import type { SavedSyncData } from "./storage";

async function getSharedDistinctId() {
  const { posthog_distinct_id } =
    await browser.storage.local.get<SavedSyncData>("posthog_distinct_id");
  if (posthog_distinct_id) {
    return posthog_distinct_id;
  }

  // Generate new distinct ID and store it
  const distinctId = uuidv7();
  await browser.storage.local.set<SavedSyncData>({
    posthog_distinct_id: distinctId,
  });
  return distinctId;
}

export async function initPosthog(config: Partial<PostHogConfig>) {
  return posthog.init(import.meta.env.VITE_POSTHOG_TOKEN, {
    bootstrap: {
      distinctID: await getSharedDistinctId(),
    },
    api_host: "https://us.i.posthog.com",
    disable_external_dependency_loading: true,
    capture_pageview: true,
    ...config,
  });
}

export { default } from "posthog-js/dist/module.no-external";
