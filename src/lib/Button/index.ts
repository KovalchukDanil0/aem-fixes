export { default as Button } from "./Button.svelte";
export { default as ButtonEnv } from "./ButtonEnv.svelte";

type ColorVariant =
  | "gray"
  | "rich-black"
  | "light-blue"
  | "sky-blue"
  | "deep-space-blue"
  | "air-force-blue";

export type ShapeVariant = "small" | "medium" | "big";

export interface ButtonProps {
  color: ColorVariant;
  rounded?: ShapeVariant;
}
