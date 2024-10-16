import { BinaryBuffer } from "maple2-file/dist/crypto/common/BinaryBuffer";
import { PackFileEntry } from "maple2-file/dist/crypto/common/PackFileEntry";

export interface IElectronAPI {
  getAppVersion: () => Promise<string>;
  exitApp: () => Promise<void>;
  showOpenDialog: (
    options: Electron.OpenDialogOptions,
  ) => Promise<Electron.OpenDialogReturnValue>;
  showSaveDialog: (
    options: Electron.SaveDialogOptions,
  ) => Promise<Electron.SaveDialogReturnValue>;

  openM2d: (filePath: string) => Promise<PackFileEntry[]>;
  saveM2d: (filePath: string) => Promise<[boolean, string]>;

  getDataPackFileEntry: (packFileEntry: number) => Promise<string>;
  getXmlPackFileEntry: (packFileEntry: number) => Promise<string>;

  saveXmlPackFileEntry: (
    packFileEntryIndex: number,
    value: string,
  ) => Promise<[boolean, string]>;
  saveDataPackFileEntry: (
    packFileEntryIndex: number,
    value: Buffer,
  ) => Promise<[boolean, string]>;

  hasChangedFiles: () => Promise<boolean>;

  saveEditorSettings: (data: Record<string, any>) => Promise<void>;
  getEditorSettings: () => Promise<Record<string, any>>;

  savePanelSize: (size: number) => Promise<void>;
  getPanelSize: () => Promise<number>;
}

declare global {
  interface Window {
    electron: IElectronAPI;
  }
}
