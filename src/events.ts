import { app, dialog, ipcMain } from "electron";
import { M2dReader } from "maple2-file";
import { PackFileEntry } from "maple2-file/dist/crypto/common/PackFileEntry";

let m2dReader: M2dReader;

ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});

ipcMain.handle("show-open-dialog", async (event, options) => {
  return await dialog.showOpenDialog(options);
});

ipcMain.handle("reader-m2d", async (event, filePath) => {
  const reader = new M2dReader(filePath);
  m2dReader = reader;
  return reader.files;
});

ipcMain.handle(
  "get-data-pack-file-entry",
  async (event, packFileEntryIndex: number) => {
    if (!m2dReader) {
      throw new Error("M2D reader not initialized");
    }

    return m2dReader.getBytes(m2dReader.files[packFileEntryIndex]);
  },
);

ipcMain.handle(
  "get-xml-pack-file-entry",
  async (event, packFileEntryIndex: number) => {
    console.log("🚀 ~ ipcMain.handle ~ packFileEntry:", packFileEntryIndex);
    if (!m2dReader) {
      throw new Error("M2D reader not initialized");
    }

    try {
      return m2dReader.getString(m2dReader.files[packFileEntryIndex - 1]);
    } catch (error) {
      console.error("Error reading XML", error);
    }
  },
);
