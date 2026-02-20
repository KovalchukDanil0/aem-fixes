<script lang="ts">
  import { Link } from "$lib";
  import { Github, Wrench } from "@lucide/svelte";
</script>

<div class="useful-links">
  <Link href="/options.html" postHogEvent="options_link_clicked">
    <Wrench />
  </Link>

  <Link
    href="https://github.com/KovalchukDanil0/aem-fixes#features"
    target="_blank"
    postHogEvent="guide_link_clicked"
  >
    <Github />
  </Link>
</div>

<style lang="scss">
  div.useful-links {
    display: flex;
    flex-grow: 0.5;
    gap: 0.5rem;
    align-items: flex-end;
    width: 100%;
    justify-content: space-between;
  }
</style>
