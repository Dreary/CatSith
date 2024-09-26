import { PackFileEntry } from "maple2-file/dist/crypto/common/PackFileEntry";

export interface IElectronAPI {
  getAppVersion: () => Promise<string>;
  exitApp: () => Promise<void>;
  showOpenDialog: (
    options: Electron.OpenDialogOptions,
  ) => Promise<Electron.OpenDialogReturnValue>;
  readerM2d: (filePath: string) => Promise<PackFileEntry[]>;
  getDataPackFileEntry: (packFileEntry: number) => Promise<BynaryBuffer>;
  getXmlPackFileEntry: (packFileEntry: number) => Promise<string>;
}

declare global {
  interface Window {
    electron: IElectronAPI;
  }
}
