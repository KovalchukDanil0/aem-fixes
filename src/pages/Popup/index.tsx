import React from "react";
import { createRoot } from "react-dom/client";
import "../../assets/css/tailwind.scss";
import "./index.scss";
import Popup from "./Popup";

const container = document.getElementById("app-container");
if (!container) {
  throw new Error("Critical Error - root element was not found");
}

const root = createRoot(container);
root.render(<Popup />);
