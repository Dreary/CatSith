import { PackFileEntry } from "maple2-file/dist/crypto/common/PackFileEntry";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  exitApp: () => ipcRenderer.invoke("exit-app"),
  showOpenDialog: (options: Electron.OpenDialogOptions) =>
    ipcRenderer.invoke("show-open-dialog", options),
  showSaveDialog: (options: Electron.SaveDialogOptions) =>
    ipcRenderer.invoke("show-save-dialog", options),

  openM2d: (filePath: string) => ipcRenderer.invoke("open-m2d", filePath),
  saveM2d: (filePath: string) => ipcRenderer.invoke("save-m2d", filePath),

  getXmlPackFileEntry: (packFileEntry: PackFileEntry) =>
    ipcRenderer.invoke("get-xml-pack-file-entry", packFileEntry),
  getDataPackFileEntry: (packFileEntry: PackFileEntry) =>
    ipcRenderer.invoke("get-data-pack-file-entry", packFileEntry),

  saveXmlPackFileEntry: (packFileEntryIndex: number, value: string) =>
    ipcRenderer.invoke("save-xml-pack-file-entry", packFileEntryIndex, value),
  saveDataPackFileEntry: (packFileEntryIndex: number, value: Buffer) =>
    ipcRenderer.invoke("save-data-pack-file-entry", packFileEntryIndex, value),

  hasChangedFiles: () => ipcRenderer.invoke("has-changed-files"),
});
