<script lang="ts">
  import type { HTMLButtonAttributes } from "svelte/elements";

  const { ...restProps }: HTMLButtonAttributes = $props();

  function openAllPages() {
    const links = document.querySelectorAll<HTMLAnchorElement>(
      "body > div.wrapper-conf div.configSubSection div.page.section div.configValue > a",
    );
    links.forEach(({ href }) => window.open(href));
  }
</script>

<button {...restProps} onclick={openAllPages} type="button">
  OPEN ALL PAGES
</button>
