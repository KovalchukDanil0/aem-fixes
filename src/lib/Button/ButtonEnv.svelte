<script lang="ts">
  import { sendMessage, type ProtocolMap } from "$lib/messaging";
  import { pascalCase } from "change-case";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import { Button, type ColorVariant } from ".";
  import type { PostHogProps } from "../types";

  interface Props
    extends
      Omit<HTMLButtonAttributes, "id" | "onclick" | "onauxclick">,
      Partial<PostHogProps> {
    variant: ColorVariant;
    btnSubject?: keyof ProtocolMap;
    btnSendAs?: "tab" | "runtime";
    btnEnv?: EnvTypes;
  }

  const { btnSendAs, btnEnv, btnSubject, children, ...restProps }: Props =
    $props();

  const id = () =>
    btnEnv ? (btnSubject ?? "") + pascalCase(btnEnv) : btnSubject;

  async function buttonOnClick({
    type,
    button,
  }: EventHandler<HTMLButtonElement>) {
    // check if left or middle mouse button is clicked
    if (button > 1) {
      return;
    }

    if (!btnSendAs || !btnSubject) {
      return;
    }

    const activeTabs = await browser.tabs.query({
      highlighted: true,
      currentWindow: true,
    });

    const [tab] = btnSendAs === "tab" ? activeTabs : [];

    await sendMessage(
      btnSubject,
      {
        newTab: type !== "click",
        tabs: activeTabs,
        env: btnEnv,
      },
      tab?.id,
    );
  }
</script>

<Button
  {...restProps}
  onclick={buttonOnClick}
  onauxclick={buttonOnClick}
  id={id()}
  shape="rounded"
>
  {@render children?.()}
</Button>
