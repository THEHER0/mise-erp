const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // ── Data persistence ────────────────────────────────────────────────────
  getData: () => ipcRenderer.invoke("store:get"),
  setData: (data) => ipcRenderer.invoke("store:set", data),
  getSettings: () => ipcRenderer.invoke("store:getSettings"),
  setSettings: (settings) => ipcRenderer.invoke("store:setSettings", settings),
  isFirstLaunch: () => ipcRenderer.invoke("store:isFirstLaunch"),
  completeOnboarding: (settings) => ipcRenderer.invoke("store:completeOnboarding", settings),

  // ── PDF export ──────────────────────────────────────────────────────────
  exportInvoicePDF: (invoiceId) => ipcRenderer.invoke("pdf:exportInvoice", invoiceId),

  // ── Google Auth ─────────────────────────────────────────────────────────
  getAuthStatus: () => ipcRenderer.invoke("auth:status"),
  connectGoogle: () => ipcRenderer.invoke("auth:connect"),
  disconnectGoogle: () => ipcRenderer.invoke("auth:disconnect"),
  onAuthConnected: (cb) => ipcRenderer.on("auth:connected", (_e, info) => cb(info)),

  // ── Gmail ───────────────────────────────────────────────────────────────
  emailInvoice: (payload) => ipcRenderer.invoke("gmail:sendInvoice", payload),

  // ── Google Drive ────────────────────────────────────────────────────────
  driveBackup: () => ipcRenderer.invoke("drive:backup"),
  driveListBackups: () => ipcRenderer.invoke("drive:listBackups"),
  driveRestore: (fileId) => ipcRenderer.invoke("drive:restore", fileId),

  // ── Auto-updater ────────────────────────────────────────────────────────
  checkForUpdates: () => ipcRenderer.invoke("updater:check"),
  installUpdate: () => ipcRenderer.invoke("updater:install"),
  onUpdateAvailable: (cb) => ipcRenderer.on("update:available", (_e, info) => cb(info)),
  onUpdateDownloaded: (cb) => ipcRenderer.on("update:downloaded", (_e, info) => cb(info)),
  removeUpdateListeners: () => {
    ipcRenderer.removeAllListeners("update:available");
    ipcRenderer.removeAllListeners("update:downloaded");
  },
});
