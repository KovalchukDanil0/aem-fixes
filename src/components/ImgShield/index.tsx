import { ComponentProps, ReactElement } from "react";

interface Props extends ComponentProps<"img"> {
  text: string[];
  color: string;
}

export default function ImgShield({
  text,
  color,
  ...props
}: Readonly<Props>): ReactElement {
  return (
    <img
      {...props}
      src={`https://img.shields.io/badge/${text.join("-")}-${color}`}
    />
  );
}
