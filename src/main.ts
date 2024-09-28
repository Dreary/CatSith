import { app, BrowserWindow, shell } from "electron";
import path from "path";
import "dotenv/config";

import logger from "electron-log/main";

// #region Squirrel Installer
import ess from "electron-squirrel-startup";
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (ess) {
  app.quit();
}
// #endregion

// #region Auto Updater
import { updateElectronApp } from "update-electron-app";
updateElectronApp();
// #endregion

// #region Main Window
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    resizable: true,
    width: 1024,
    height: 680,
    minWidth: 1024,
    minHeight: 680,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#030711',
      symbolColor: '#fff',
      height: 39
    },
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      // nodeIntegrationInWorker: true,
    },
    // icon: "./images/icon.ico",
  });

  mainWindow.removeMenu();

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) shell.openExternal(url);
    return { action: "deny" };
  });
};

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
// #endregion

// Sample reading
// import { M2dReader } from "maple2-file";

// const reader = new M2dReader("Data/Xml.m2d");
// const entry = reader.getEntry("achieve/21100001.xml");
// if (entry) {
//     logger.info(reader.getString(entry));
// }

import "./events";
