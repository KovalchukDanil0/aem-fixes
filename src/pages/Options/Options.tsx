import React from "react";
import { useAsync } from "react-async";
import { Checkbox, Loading } from "react-daisyui";
import Browser from "webextension-polyfill";
import UploadJsonFile from "../../containers/UploadJsonFile";
import { SavedSyncData, loadSavedData } from "../../shared";

const settingNames = {
  disCreateWF: "Disable create WF button",
  disMothersiteCheck: "Disable motersite check",
  enableAutoLogin: "Enable auto login",
  enableFilterFix: "Enable filter fix",
  enableFunErr: "Enable funny errors",
};

async function saveOptions(event: React.MouseEvent<HTMLInputElement>) {
  const elm = event.currentTarget;

  const data: SavedSyncData = { [elm.id]: elm.checked };
  Browser.storage.sync.set(data);
}

const initVariables = async (): Promise<SavedSyncData> => loadSavedData();

export default function Options() {
  const {
    data: savedData,
    error,
    isPending,
  } = useAsync({ promiseFn: initVariables });

  if (isPending) {
    return (
      <div className="grid h-44 place-items-center">
        <Loading />
      </div>
    );
  }

  if (error || !savedData) {
    return (
      <p>Something went wrong: {error?.message ?? "savedData is undefined"}</p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {Object.keys(savedData).map((data) => (
        <label key={data} className="w-2/3 text-white">
          <Checkbox
            className="relative bottom-px mr-2 align-middle"
            id={data}
            onClick={saveOptions}
            defaultChecked={savedData[data as keyof typeof savedData]}
          />
          {settingNames[data as keyof typeof settingNames]}
        </label>
      ))}

      <UploadJsonFile />
    </div>
  );
}
