import React, { MouseEvent } from "react";
import { Async } from "react-async";
import { Checkbox, Loading } from "react-daisyui";
import { storage } from "webextension-polyfill";
import UploadJsonFile from "../../containers/UploadJsonFile";
import { SavedSyncData, loadSavedData } from "../../shared";

const settingNames = {
  disCreateWF: "Disable create WF button",
  disMothersiteCheck: "Disable motersite check",
  enableAutoLogin: "Enable auto login",
  enableFilterFix: "Enable filter fix",
  enableFunErr: "Enable funny errors",
};

async function saveOptions(event: MouseEvent<HTMLInputElement>) {
  const elm = event.currentTarget;

  const data: SavedSyncData = { [elm.id]: elm.checked };
  storage.sync.set(data);
}

const initVariables = async (): Promise<SavedSyncData> => loadSavedData();

export default function Options() {
  return (
    <Async promiseFn={initVariables}>
      <Async.Pending>
        <div className="grid h-44 place-items-center">
          <Loading />
        </div>
      </Async.Pending>
      <Async.Fulfilled>
        {(savedData: SavedSyncData) => (
          <div className="flex flex-col gap-5">
            {Object.keys(savedData).map((data) => (
              <label
                key={data}
                className="w-fit cursor-pointer text-sm text-white md:text-4xl"
              >
                <Checkbox
                  className="relative bottom-px mr-2 size-5 align-middle md:size-8"
                  id={data}
                  onClick={saveOptions}
                  defaultChecked={savedData[data as keyof typeof savedData]}
                />
                <p className="inline-block md:ml-3">
                  {settingNames[data as keyof typeof settingNames]}
                </p>
              </label>
            ))}

            <UploadJsonFile />
          </div>
        )}
      </Async.Fulfilled>
      <Async.Rejected>
        {(error) => `Something went wrong: ${error.message}`}
      </Async.Rejected>
    </Async>
  );
}
