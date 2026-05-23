import { app, BrowserWindow, Menu, Tray, globalShortcut, nativeImage } from "electron";
import { startServer } from "./server.js";

let mainWindow;
let tray;
let serverHandle;

const port = Number(process.env.PET_PORT || 4243);
const localUrl = `http://localhost:${port}`;

function createTrayIcon() {
  const image = nativeImage.createEmpty();
  tray = new Tray(image);
  tray.setToolTip("AI Pet");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "显示/隐藏", click: toggleWindow },
      { label: "退出", click: () => app.quit() }
    ])
  );
  tray.on("click", toggleWindow);
}

function createWindow(url) {
  mainWindow = new BrowserWindow({
    width: 520,
    height: 360,
    minWidth: 360,
    minHeight: 260,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: true,
    title: "AI Pet",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.setAlwaysOnTop(true, "floating");
  mainWindow.loadURL(url);

  mainWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function toggleWindow() {
  if (!mainWindow) return;
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
}

async function startOrUseServer() {
  try {
    return await startServer({ port });
  } catch (error) {
    if (error.code === "EADDRINUSE") {
      console.log(`Using existing AI Pet server at ${localUrl}`);
      return { server: null, wss: null, url: localUrl, port, host: "127.0.0.1" };
    }
    throw error;
  }
}

app.whenReady().then(async () => {
  serverHandle = await startOrUseServer();
  createWindow(serverHandle.url);
  createTrayIcon();

  globalShortcut.register("CommandOrControl+Shift+P", toggleWindow);
});

app.on("before-quit", () => {
  app.isQuitting = true;
  globalShortcut.unregisterAll();
  serverHandle?.server.close();
});

app.on("window-all-closed", (event) => {
  event.preventDefault();
});
