import { ChangeEvent, ReactElement } from "react";
import { FileInput } from "react-daisyui";
import { SavedSyncData } from "src/lib/types";
import { storage } from "webextension-polyfill";
import { create } from "zustand";
import "./index.scss";

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

function handleFileSelect({
  target: { files },
}: ChangeEvent<HTMLInputElement>): void {
  if (!files) {
    throw new Error("File cannot be read");
  }

  const reader = new FileReader();
  reader.onload = handleFileLoad;
  reader.readAsText(files[0] as Blob);
}

async function handleFileLoad({
  target,
}: ProgressEvent<FileReader>): Promise<void> {
  if (!target?.result) {
    throw new Error("event target result is undefined");
  }

  const secretSettings: SavedSyncData = JSON.parse(target.result as string);
  storage.local.set({ secretSettings });

  useStateUploaded.setState({ fileUploaded: true });
  setTimeout(() => window.close(), 3000);
}

export default function Standalone(): ReactElement {
  const { fileUploaded } = useStateUploaded();

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3">
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
