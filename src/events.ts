import { app, dialog, ipcMain } from "electron";
import { M2dReader, M2dWriter } from "maple2-file";
import { BinaryBuffer } from "maple2-file/dist/crypto/common/BinaryBuffer";

import logger from "electron-log/main";

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
  async (event, packFileEntryIndex: number): Promise<Buffer> => {
    if (!m2dReader) {
      throw new Error("M2D reader not initialized");
    }

    return m2dReader
      .getBytes(m2dReader.files[packFileEntryIndex - 1])
      .getBuffer();
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

ipcMain.handle(
  "save-xml-pack-file-entry",
  async (event, packFileEntryIndex: number, xml: string) => {
    const packFileEntry = m2dReader.files.find(
      (entry) => entry.index === packFileEntryIndex,
    );
    if (!packFileEntry) {
      return [false, "Pack file entry not found"];
    }

    const xmlBytes = BinaryBuffer.fromBuffer(Buffer.from(xml, "utf-8"));
    packFileEntry.data = xmlBytes;
    packFileEntry.changed = true;
  },
);

ipcMain.handle("save-m2d", async (event, filePath?: string) => {
  try {
    // Note: the writer creates a copy of the read buffer & file array. Might eat a lot of memory
    const writer = M2dWriter.fromReader(m2dReader);

    if (filePath !== writer.filePath) {
      writer.filePath = filePath;
    }

    writer.save();
    return [true, "Saved M2D"];
  } catch (error) {
    logger.error(error);
    return [false, error.message];
  }
});
