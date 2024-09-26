import { app, dialog, ipcMain } from "electron";
import { M2dReader } from "maple2-file";

let m2dReader: M2dReader;

ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});

ipcMain.handle("exit-app", () => {
  app.exit();
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

    return m2dReader.getBytes(m2dReader.files[packFileEntryIndex - 1]);
  },
);

ipcMain.handle(
  "get-xml-pack-file-entry",
  async (event, packFileEntryIndex: number) => {
    if (!m2dReader) {
      throw new Error("M2D reader not initialized");
    }

    try {
      const data = m2dReader.getBytes(m2dReader.files[packFileEntryIndex - 1]);

      if (!data) {
        throw new Error("Data not found");
      }

      let decoder = new TextDecoder("utf-8");
      const text = decoder.decode(data.getBuffer());
      if (text.includes('encoding="euc-kr"')) {
        decoder = new TextDecoder("euc-kr");
        return decoder.decode(data.getBuffer());
      }
      return text;
    } catch (error) {
      console.error("Error reading XML", error);
    }
  },
);
