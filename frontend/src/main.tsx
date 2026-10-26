import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/index.css";
import { applyBackgroundStyle, readBackgroundStyle } from "./background-style";

applyBackgroundStyle(readBackgroundStyle());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
