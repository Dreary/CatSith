import { BrowserWindow } from "electron";
import settings from "electron-settings";
import { debounce } from "./web/lib/utils";

interface WindowState {
  x: number | undefined;
  y: number | undefined;
  width: number;
  height: number;
  isMaximized?: boolean;
}

export const windowStateKeeper = async (windowName: string) => {
  let window: BrowserWindow;
  let windowState: WindowState;
  settings.configure({ atomicSave: process.platform !== "win32" }); // Windows skill issue

  const setBounds = async () => {
    if (await settings.has(`windowState.${windowName}`)) {
      windowState = (await settings.get(`windowState.${windowName}`)) as any;
      return;
    }

    // Default
    windowState = {
      x: undefined,
      y: undefined,
      width: 1024,
      height: 680,
    } as WindowState;
  };

  const saveState = debounce(async () => {
    if (!windowState.isMaximized) {
      windowState = window.getBounds();
    }
    windowState.isMaximized = window.isMaximized();
    await settings.set(`windowState.${windowName}`, windowState as any);
  }, 500);

  const track = async (win: BrowserWindow) => {
    window = win;
    ["resize", "move", "close"].forEach((event) => {
      win.on(event as any, saveState);
    });
  };

  await setBounds();

  return {
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    isMaximized: windowState.isMaximized,
    track,
  };
};
