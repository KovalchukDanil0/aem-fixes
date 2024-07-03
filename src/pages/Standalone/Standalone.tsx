import React, { ChangeEvent } from "react";
import { FileInput } from "react-daisyui";
import Browser from "webextension-polyfill";
import { create } from "zustand";
import { SavedSyncData } from "../../shared";

const useStateUploaded = create<{
  fileUploaded: boolean;
  setFileUploaded: (fileUploaded: boolean) => void;
}>((set) => ({
  fileUploaded: false,
  setFileUploaded: (fileUploaded) =>
    set(() => ({
      fileUploaded,
    })),
}));

function handleFileSelect(event: ChangeEvent<HTMLInputElement>) {
  if (!event.target.files) {
    throw new Error("File cannot be read");
  }

  const reader = new FileReader();
  reader.onload = handleFileLoad;
  reader.readAsText(event.target.files[0] as Blob);
}

async function handleFileLoad(event: ProgressEvent<FileReader>) {
  if (!event.target?.result) {
    throw new Error("event target result is undefined");
  }

  const secretSettings: SavedSyncData = JSON.parse(
    event.target.result as string,
  );
  Browser.storage.local.set({ secretSettings });

  useStateUploaded.setState({ fileUploaded: true });
}

export default function Standalone() {
  const { fileUploaded } = useStateUploaded();

  if (!fileUploaded) {
    return (
      <div>
        <FileInput type="file" accept=".json" onChange={handleFileSelect} />
        <p>Please upload valid json file</p>
      </div>
    );
  }

  setTimeout(() => window.close(), 3000);

  return (
    <p className="text-green-600">File is uploaded, page will be closed.</p>
  );
}
