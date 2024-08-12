import React, { ComponentProps } from "react";

interface Props extends ComponentProps<"img"> {
  text: string[];
  color: string;
}

export default function ImgShield({ text, color, alt }: Readonly<Props>) {
  return (
    <img
      alt={alt}
      src={`https://img.shields.io/badge/${text.join("-")}-${color}`}
    />
  );
}
