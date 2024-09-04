import React from "react";
import { createRoot } from "react-dom/client";
import "../../assets/scss/tailwind.scss";
import "./index.scss";
import Popup from "./Popup";

const container = document.getElementById("app-container") as HTMLElement;

const root = createRoot(container);
root.render(<Popup />);
