import React, { ReactElement } from "react";
import { Button } from "react-daisyui";
import Browser from "webextension-polyfill";

export default function UploadJsonFile(): ReactElement {
  return (
    <div>
      <p>
        Please note that this extension wouldn't correctly work without correct
        Json file uploaded
      </p>
      <Button
        tag="a"
        target="_blank"
        rel="noreferrer"
        color="warning"
        href={Browser.runtime.getURL("standalone.html")}
      >
        Upload json file here
      </Button>
      <p>
        <sub>if you need private file, please contact developer</sub>
      </p>
    </div>
  );
}
