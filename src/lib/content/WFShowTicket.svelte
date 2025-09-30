<script lang="ts">
  import { jiraFullPath } from "$lib/storage";
  import type { HTMLAnchorAttributes } from "svelte/elements";

  interface Props extends HTMLAnchorAttributes {
    blockingTicket: string;
  }

  const { blockingTicket, ...restProps }: Props = $props();

  const regexRemoveCommas = /.+(ESM-\d\d\d\d\d\d?).+/;

  const blockingTicketReplaced = blockingTicket.replace(
    regexRemoveCommas,
    "$1",
  );
</script>

<a
  {...restProps}
  class="showTicket"
  href="https://{jiraFullPath}{blockingTicketReplaced}#view-subtasks"
  target="_blank"
  rel="noreferrer"
>
  {blockingTicket}
</a>

<style lang="scss">
  a.showTicket {
    cursor: pointer;
    font-weight: 500;
    color: rgb(59 130 246);

    &:hover {
      text-decoration-line: underline;
    }
  }
</style>
