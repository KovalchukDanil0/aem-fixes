<script lang="ts">
  import type { HTMLAnchorAttributes } from "svelte/elements";

  interface Props extends HTMLAnchorAttributes {
    url: string;
  }

  const { url, ...restProps }: Props = $props();

  function openInTree() {
    browser.runtime.sendMessage<MessageCommon>({
      from: "content",
      subject: "openInTree",
      url,
    });
  }
</script>

<a {...restProps} onclick={openInTree} class="findReplaceLink">{url}</a>

<style lang="scss">
  a.findReplaceLink {
    font-weight: 500;
    color: #2563eb;
    cursor: default;

    &:hover {
      text-decoration: underline;
      cursor: pointer;
    }
  }
</style>
