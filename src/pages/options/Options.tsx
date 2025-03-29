import { MouseEvent, ReactElement } from "react";
import { Async } from "react-async";
import { Checkbox, Loading } from "react-daisyui";
import { UploadJsonFile } from "src/components";
import { loadSavedData } from "src/lib/storage";
import { SavedSyncData } from "src/lib/types";
import { storage } from "webextension-polyfill";
import "./index.scss";

const settingNames = {
  disCreateWF: "Disable create WF button",
  disMothersiteCheck: "Disable motersite check",
  enableAutoLogin: "Enable auto login",
  enableFilterFix: "Enable filter fix",
  enableFunErr: "Enable funny errors",
};

async function saveOptions({
  currentTarget: { id, checked },
}: MouseEvent<HTMLInputElement>): Promise<void> {
  const data: SavedSyncData = { [id]: checked };

  // @ts-expect-error types issue
  storage.sync.set(data);
}

const initVariables = async (): Promise<SavedSyncData> => loadSavedData();

export default function Options(): ReactElement {
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
            {Object.keys(savedData).map((option) => (
              <label
                key={option}
                className="w-fit cursor-pointer text-sm text-white md:text-4xl"
              >
                <Checkbox
                  color="warning"
                  className="relative bottom-px mr-2 size-5 align-middle md:size-8"
                  id={option}
                  onClick={saveOptions}
                  defaultChecked={savedData[option as keyof typeof savedData]}
                />
                <p className="inline-block md:ml-3">
                  {settingNames[option as keyof typeof settingNames]}
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
