import { createRoot } from "react-dom/client";
import "src/styles/tailwind.scss";
import Popup from "./Popup";

const container = document.querySelector<HTMLElement>("#app-container");
if (!container) {
  throw new Error("CRITICAL ERROR - root is undefined");
}

const root = createRoot(container);
root.render(<Popup />);
