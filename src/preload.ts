import { PackFileEntry } from "maple2-file/dist/crypto/common/PackFileEntry";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  showOpenDialog: (options: Electron.OpenDialogOptions) =>
    ipcRenderer.invoke("show-open-dialog", options),
  readerM2d: (filePath: string) => ipcRenderer.invoke("reader-m2d", filePath),
  getXmlPackFileEntry: (packFileEntry: PackFileEntry) =>
    ipcRenderer.invoke("get-xml-pack-file-entry", packFileEntry),
  getDataPackFileEntry: (packFileEntry: PackFileEntry) =>
    ipcRenderer.invoke("get-data-pack-file-entry", packFileEntry),
});
