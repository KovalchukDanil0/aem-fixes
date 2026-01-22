<script lang="ts">
  import type { HTMLImgAttributes } from "svelte/elements";

  interface Props extends HTMLImgAttributes {
    githubPath: string;
    memesData: MemeResponseType;
  }

  const { githubPath, memesData, ...restProps }: Props = $props();

  const generateRandom = (maxLimit: number) =>
    Math.floor(Math.random() * maxLimit);

  const memesLength = () => Object.keys(memesData).length;

  const memeImage = () =>
    memesData[generateRandom(memesLength() - 1)] ?? { path: "" };

  const alt = "Programmer Meme";
</script>

<img
  {...restProps}
  {alt}
  src={githubPath + memeImage().path}
  draggable="false"
  title={alt}
  class="completed"
/>
