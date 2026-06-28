const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const os = require("os");
const fs = require("fs");

// ─── electron-store (CommonJS dynamic import workaround for ESM-only v9+) ───
let store;
async function initStore() {
  const { default: Store } = await import("electron-store");
  store = new Store({
    name: "data",
    defaults: {
      onboardingComplete: false,
      settings: null,
      erpData: null,
    },
  });
}

// ─── electron-updater ────────────────────────────────────────────────────────
let autoUpdater;
async function initUpdater(win) {
  try {
    const { autoUpdater: au } = await import("electron-updater");
    autoUpdater = au;
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on("update-available", (info) => {
      win.webContents.send("update:available", info);
    });
    autoUpdater.on("update-downloaded", (info) => {
      win.webContents.send("update:downloaded", info);
    });
    autoUpdater.on("error", (err) => {
      console.error("Updater error:", err.message);
    });

    // Only check for updates in packaged app
    if (app.isPackaged) {
      autoUpdater.checkForUpdates().catch(console.error);
    }
  } catch (err) {
    console.error("Could not init updater:", err.message);
  }
}

// ─── IPC HANDLERS ────────────────────────────────────────────────────────────
function registerIPC() {
  ipcMain.handle("store:get", () => store.get("erpData"));
  ipcMain.handle("store:set", (_e, data) => store.set("erpData", data));
  ipcMain.handle("store:getSettings", () => store.get("settings"));
  ipcMain.handle("store:setSettings", (_e, settings) => store.set("settings", settings));
  ipcMain.handle("store:isFirstLaunch", () => !store.get("onboardingComplete"));
  ipcMain.handle("store:completeOnboarding", (_e, settings) => {
    store.set("settings", settings);
    store.set("onboardingComplete", true);
    store.set("erpData", null); // start with empty dataset
  });

  // PDF export
  ipcMain.handle("pdf:exportInvoice", async (_e, invoiceId) => {
    const win = BrowserWindow.getAllWindows()[0];
    if (!win) throw new Error("No window found");

    const pdfData = await win.webContents.printToPDF({
      marginsType: 1,
      pageSize: "Letter",
      printBackground: true,
    });

    const downloadsPath = path.join(os.homedir(), "Downloads");
    const fileName = `${invoiceId}-${Date.now()}.pdf`;
    const filePath = path.join(downloadsPath, fileName);
    fs.writeFileSync(filePath, pdfData);
    shell.showItemInFolder(filePath);
    return filePath;
  });

  // Auto-updater
  ipcMain.handle("updater:check", () => {
    if (autoUpdater && app.isPackaged) return autoUpdater.checkForUpdates();
  });
  ipcMain.handle("updater:install", () => {
    if (autoUpdater) autoUpdater.quitAndInstall();
  });
}

// ─── CREATE WINDOW ────────────────────────────────────────────────────────────
async function createWindow() {
  await initStore();

  const isDev = !app.isPackaged;

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: "#f8f9fb",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  });

  win.once("ready-to-show", () => win.show());

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, "dist", "index.html"));
  }

  registerIPC();
  await initUpdater(win);
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
