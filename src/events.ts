import { app, ipcMain } from "electron";

ipcMain.handle("get-app-version", () => {
    return app.getVersion();
});
