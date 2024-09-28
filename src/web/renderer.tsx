import React from "react";
import ReactDOM from "react-dom/client";
import App from "./src/App";
import "./index.css";
import { AppProvider } from "./src/AppState";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>,
);
