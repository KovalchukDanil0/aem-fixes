import { createRoot } from "react-dom/client";
import "src/styles/tailwind.scss";
import Options from "./Options";

const container = document.querySelector<HTMLElement>("#app-container");
if (!container) {
  throw new Error("CRITICAL ERROR - root is undefined");
}

const root = createRoot(container);
root.render(<Options />);
