import React, { ReactElement } from "react";
import { Button } from "react-daisyui";
import { useMediaQuery } from "react-responsive";

export default function UploadJsonFile(): ReactElement {
  const isDesktop = useMediaQuery({
    query: "(min-width: 768px)",
  });

  return (
    <div className="mt-0 md:mt-auto">
      <p className="text-sm md:text-lg">
        Please note that this extension wouldn't correctly work without correct
        Json file uploaded
      </p>
      <Button
        tag="a"
        target="_blank"
        rel="noreferrer"
        color="warning"
        href="/src/pages/standalone/index.html"
        size={isDesktop ? "lg" : "md"}
      >
        Upload json file here
      </Button>
      <p className="text-xs md:text-base">
        <sub>if you need private file, please contact developer</sub>
      </p>
    </div>
  );
}
