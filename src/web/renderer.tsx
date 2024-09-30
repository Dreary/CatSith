import React from "react";
import ReactDOM from "react-dom/client";
import App from "./src/App";
import "./index.css";
import { AppProvider } from "./src/AppState";
import { Toaster } from "@/web/components/ui/toaster";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProvider>
      <App />
      <Toaster />
    </AppProvider>
  </React.StrictMode>,
);
