<script lang="ts">
  import { regexDetermineBeta } from "$lib/storage";
  import type { HTMLAttributes } from "svelte/elements";

  type Props = ReferencesConfig & HTMLAttributes<EventTarget>;

  const { pages, ...restProps }: Props = $props();
</script>

<div {...restProps} class="referencesBanner">
  {#if pages.length !== 0}
    {#each pages.toSorted( ({ path }, { path: pathToCompare }) => path.localeCompare(pathToCompare), ) as { path }}
      <a
        href={path.replace(regexDetermineBeta, `$1/${"editor.html"}$2`) +
          ".html"}
        target="_blank"
        rel="noreferrer">{path}</a
      >
    {/each}
  {:else}
    <p>No References Found</p>
  {/if}
</div>

<style lang="scss">
  div.referencesBanner {
    display: flex;
    flex-direction: column;
    background-color: slategray;
    padding: 6rem;
    gap: 1rem;

    a {
      width: fit-content;
      font-weight: 500;
      color: aqua;
      text-decoration-line: none;
      line-height: normal;

      &:hover {
        text-decoration-line: underline;
        color: aquamarine;
      }
    }
  }
</style>
