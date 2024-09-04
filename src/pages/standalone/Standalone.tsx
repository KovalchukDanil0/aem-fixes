import React, { ChangeEvent } from "react";
import { FileInput } from "react-daisyui";
import { storage } from "webextension-polyfill";
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
  storage.local.set({ secretSettings });

  useStateUploaded.setState({ fileUploaded: true });
  setTimeout(() => window.close(), 3000);
}

export default function Standalone() {
  const { fileUploaded } = useStateUploaded();

  return (
    <div className="flex h-auto flex-col items-center justify-center gap-3">
      <FileInput
        size="lg"
        color="primary"
        type="file"
        accept=".json"
        onChange={handleFileSelect}
      />

      <div className="text-shadow text-shadow-blur-2 text-shadow-x-xl text-shadow-y-xl">
        {!fileUploaded ? (
          <p className="text-lg text-white">Please upload valid json file</p>
        ) : (
          <p className="text-lg text-green-400">
            File is uploaded, page will be closed.
          </p>
        )}
      </div>
    </div>
  );
}
