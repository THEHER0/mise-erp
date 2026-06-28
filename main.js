const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const os = require("os");
const fs = require("fs");
const http = require("http");
const crypto = require("crypto");
const { URL, URLSearchParams } = require("url");

// ─── Paddle licensing config ──────────────────────────────────────────────────
// Set these via environment variables or replace with your real Paddle values:
//   https://vendors.paddle.com → Products → your product
const PADDLE_VENDOR_ID     = process.env.PADDLE_VENDOR_ID     || "YOUR_VENDOR_ID";
const PADDLE_PRODUCT_ID    = process.env.PADDLE_PRODUCT_ID    || "YOUR_PRODUCT_ID";
const PADDLE_VENDOR_AUTH   = process.env.PADDLE_VENDOR_AUTH   || "YOUR_VENDOR_AUTH_CODE";
const PADDLE_CHECKOUT_URL  = `https://buy.paddle.com/product/${PADDLE_PRODUCT_ID}`;
const TRIAL_DAYS           = 30;

// ─── Google OAuth config ─────────────────────────────────────────────────────
// Replace these with your real values from Google Cloud Console:
//   https://console.cloud.google.com → APIs & Services → Credentials
//   App type: Desktop app
const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID     || "YOUR_CLIENT_ID.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "YOUR_CLIENT_SECRET";
const OAUTH_REDIRECT_PORT  = 42813;
const OAUTH_REDIRECT_URI   = `http://localhost:${OAUTH_REDIRECT_PORT}`;
const OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

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
      googleTokens: null,
      license: null,          // { key, email, activatedAt, status }
      trialStartedAt: null,   // ISO date string, set on first launch
    },
  });

  // Start trial clock on first ever launch
  if (!store.get("trialStartedAt")) {
    store.set("trialStartedAt", new Date().toISOString());
  }
}

// ─── Google OAuth helpers ────────────────────────────────────────────────────
function pkce() {
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

async function refreshGoogleToken() {
  const tokens = store.get("googleTokens");
  if (!tokens?.refresh_token) throw new Error("Not connected to Google");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: tokens.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error_description || data.error);
  const updated = { ...tokens, access_token: data.access_token, expires_at: Date.now() + data.expires_in * 1000 };
  store.set("googleTokens", updated);
  return updated.access_token;
}

async function getAccessToken() {
  const tokens = store.get("googleTokens");
  if (!tokens) throw new Error("Not connected to Google");
  if (Date.now() < tokens.expires_at - 60_000) return tokens.access_token;
  return refreshGoogleToken();
}

function startOAuthFlow(win) {
  return new Promise((resolve, reject) => {
    const { verifier, challenge } = pkce();
    const state = crypto.randomBytes(16).toString("hex");

    // Local redirect server
    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url, OAUTH_REDIRECT_URI);
        if (url.searchParams.get("state") !== state) throw new Error("State mismatch");
        if (url.searchParams.get("error")) throw new Error(url.searchParams.get("error"));
        const code = url.searchParams.get("code");

        // Exchange code for tokens
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code,
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            redirect_uri: OAUTH_REDIRECT_URI,
            grant_type: "authorization_code",
            code_verifier: verifier,
          }),
        });
        const tokens = await tokenRes.json();
        if (tokens.error) throw new Error(tokens.error_description || tokens.error);

        // Fetch user info
        const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const user = await userRes.json();

        store.set("googleTokens", {
          ...tokens,
          expires_at: Date.now() + tokens.expires_in * 1000,
          email: user.email,
        });

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`<html><body style="font-family:sans-serif;text-align:center;padding:40px">
          <h2 style="color:#4f46e5">✓ Connected to Google</h2>
          <p>You can close this tab and return to Mise ERP.</p>
          <script>window.close()</script></body></html>`);
        server.close();
        resolve({ email: user.email });
        win.webContents.send("auth:connected", { email: user.email });
      } catch (err) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end(`Error: ${err.message}`);
        server.close();
        reject(err);
      }
    });

    server.listen(OAUTH_REDIRECT_PORT, "127.0.0.1", () => {
      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
      authUrl.searchParams.set("redirect_uri", OAUTH_REDIRECT_URI);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", OAUTH_SCOPES);
      authUrl.searchParams.set("state", state);
      authUrl.searchParams.set("code_challenge", challenge);
      authUrl.searchParams.set("code_challenge_method", "S256");
      authUrl.searchParams.set("access_type", "offline");
      authUrl.searchParams.set("prompt", "consent");
      shell.openExternal(authUrl.toString());
    });

    server.on("error", reject);
    setTimeout(() => { server.close(); reject(new Error("OAuth timeout")); }, 5 * 60 * 1000);
  });
}

// ─── Gmail helper ────────────────────────────────────────────────────────────
async function gmailSendInvoice(invoiceId, toEmail, subject, bodyHtml, pdfBuffer) {
  const accessToken = await getAccessToken();

  // Build RFC 2822 multipart email with PDF attachment
  const boundary = `----=_Boundary_${Date.now()}`;
  const pdfB64 = pdfBuffer.toString("base64");
  const rawEmail = [
    `To: ${toEmail}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "",
    bodyHtml,
    "",
    `--${boundary}`,
    `Content-Type: application/pdf; name="${invoiceId}.pdf"`,
    "Content-Transfer-Encoding: base64",
    `Content-Disposition: attachment; filename="${invoiceId}.pdf"`,
    "",
    pdfB64,
    `--${boundary}--`,
  ].join("\r\n");

  const encoded = Buffer.from(rawEmail).toString("base64url");
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw: encoded }),
  });
  const data = await res.json();
  if (res.status >= 400) throw new Error(data.error?.message || "Gmail send failed");
  return data.id;
}

// ─── Google Drive helpers ────────────────────────────────────────────────────
async function driveBackup() {
  const accessToken = await getAccessToken();
  const erpData = store.get("erpData");
  const settings = store.get("settings");
  const payload = JSON.stringify({ erpData, settings, backedUpAt: new Date().toISOString() });

  // Find or create mise-erp folder
  let folderId;
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name%3D'mise-erp'+and+mimeType%3D'application%2Fvnd.google-apps.folder'+and+trashed%3Dfalse&fields=files(id)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const searchData = await searchRes.json();
  if (searchData.files?.length) {
    folderId = searchData.files[0].id;
  } else {
    const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: "mise-erp", mimeType: "application/vnd.google-apps.folder" }),
    });
    const folder = await createRes.json();
    folderId = folder.id;
  }

  // Upload backup file
  const fileName = `backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  const meta = JSON.stringify({ name: fileName, parents: [folderId] });
  const form = `--foo\r\nContent-Type: application/json\r\n\r\n${meta}\r\n--foo\r\nContent-Type: application/json\r\n\r\n${payload}\r\n--foo--`;
  const uploadRes = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": 'multipart/related; boundary="foo"' },
    body: form,
  });
  const file = await uploadRes.json();
  if (uploadRes.status >= 400) throw new Error(file.error?.message || "Drive upload failed");
  return { fileName, fileId: file.id };
}

async function driveListBackups() {
  const accessToken = await getAccessToken();
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name+contains+'backup-'+and+trashed%3Dfalse&orderBy=createdTime+desc&pageSize=10&fields=files(id,name,createdTime)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const data = await res.json();
  return data.files || [];
}

async function driveRestore(fileId) {
  const accessToken = await getAccessToken();
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (data.erpData !== undefined) store.set("erpData", data.erpData);
  if (data.settings !== undefined) store.set("settings", data.settings);
  return { restoredAt: data.backedUpAt };
}

// ─── Paddle licensing helpers ─────────────────────────────────────────────────
function getLicenseStatus() {
  const license = store.get("license");
  if (license?.status === "active") return { licensed: true, trial: false, license };

  const trialStart = store.get("trialStartedAt");
  if (!trialStart) return { licensed: false, trial: false, daysLeft: 0 };

  const elapsed = Date.now() - new Date(trialStart).getTime();
  const daysLeft = Math.max(0, TRIAL_DAYS - Math.floor(elapsed / 86_400_000));
  return { licensed: false, trial: true, daysLeft, trialStart };
}

async function activateLicense(licenseKey, email) {
  // Validate with Paddle's license verification API
  const res = await fetch("https://vendors.paddle.com/api/2.0/license/verify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      vendor_id: PADDLE_VENDOR_ID,
      vendor_auth_code: PADDLE_VENDOR_AUTH,
      license_code: licenseKey,
      product_id: PADDLE_PRODUCT_ID,
    }),
  });
  const data = await res.json();

  if (!data.success) throw new Error(data.error?.message || "License validation failed");

  const licenseData = { key: licenseKey, email, activatedAt: new Date().toISOString(), status: "active", paddleData: data.response };
  store.set("license", licenseData);
  return licenseData;
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
  ipcMain.handle("pdf:statement", async (_e, { html, fileName }) => {
    const tmpHtml = path.join(os.tmpdir(), `mise-statement-${Date.now()}.html`);
    fs.writeFileSync(tmpHtml, html, "utf8");

    const win = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: false, contextIsolation: true } });
    await win.loadFile(tmpHtml);
    const pdfData = await win.webContents.printToPDF({ marginsType: 1, pageSize: "Letter", printBackground: true });
    win.close();
    fs.unlinkSync(tmpHtml);

    const filePath = path.join(os.homedir(), "Downloads", fileName);
    fs.writeFileSync(filePath, pdfData);
    shell.showItemInFolder(filePath);
    return filePath;
  });

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

  // ── Paddle Licensing ─────────────────────────────────────────────────────
  ipcMain.handle("license:status", () => getLicenseStatus());
  ipcMain.handle("license:activate", async (_e, { key, email }) => activateLicense(key, email));
  ipcMain.handle("license:openCheckout", () => shell.openExternal(PADDLE_CHECKOUT_URL));
  ipcMain.handle("license:deactivate", () => { store.delete("license"); return getLicenseStatus(); });

  // ── CSV Export ───────────────────────────────────────────────────────────
  ipcMain.handle("export:csv", async (_e, { type }) => {
    const erpData = store.get("erpData");
    if (!erpData) throw new Error("No data to export");
    let csv = "";
    if (type === "invoices") {
      csv = "Invoice ID,Customer,Date,Due,Status,Subtotal,Tax,Total\n";
      csv += erpData.invoices.map(inv => {
        const cu = erpData.customers.find(c => c.id === inv.customer_id);
        return [inv.id, `"${cu?.name || inv.customer_id}"`, inv.date, inv.due, inv.status,
          (inv.subtotal ?? inv.total).toFixed(2), (inv.tax_amount ?? 0).toFixed(2), inv.total.toFixed(2)].join(",");
      }).join("\n");
    } else if (type === "expenses") {
      csv = "Date,Vendor,Category,Amount,Notes,Receipt\n";
      csv += erpData.expenses.map(e =>
        [e.date, `"${e.vendor}"`, e.category, e.amount.toFixed(2), `"${e.notes || ""}"`, e.receipt ? "Yes" : "No"].join(",")
      ).join("\n");
    } else if (type === "customers") {
      csv = "Name,Email,Phone,City,Status,Balance\n";
      csv += erpData.customers.map(cu =>
        [`"${cu.name}"`, cu.email, cu.phone, cu.city, cu.status, (cu.balance || 0).toFixed(2)].join(",")
      ).join("\n");
    }
    const fileName = `mise-erp-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
    const filePath = path.join(os.homedir(), "Downloads", fileName);
    fs.writeFileSync(filePath, csv, "utf8");
    shell.showItemInFolder(filePath);
    return filePath;
  });

  // ── Google Auth ──────────────────────────────────────────────────────────
  ipcMain.handle("auth:status", () => {
    const tokens = store.get("googleTokens");
    return tokens ? { connected: true, email: tokens.email } : { connected: false };
  });
  ipcMain.handle("auth:connect", async () => {
    const win = BrowserWindow.getAllWindows()[0];
    return startOAuthFlow(win);
  });
  ipcMain.handle("auth:disconnect", () => {
    store.delete("googleTokens");
    return { connected: false };
  });

  // ── Gmail ────────────────────────────────────────────────────────────────
  ipcMain.handle("gmail:sendInvoice", async (_e, { invoiceId, toEmail, subject, bodyHtml }) => {
    const win = BrowserWindow.getAllWindows()[0];
    // Generate PDF first
    const pdfBuffer = await win.webContents.printToPDF({ marginsType: 1, pageSize: "Letter", printBackground: true });
    return gmailSendInvoice(invoiceId, toEmail, subject, bodyHtml, pdfBuffer);
  });

  // ── Google Drive ─────────────────────────────────────────────────────────
  ipcMain.handle("drive:backup", () => driveBackup());
  ipcMain.handle("drive:listBackups", () => driveListBackups());
  ipcMain.handle("drive:restore", (_e, fileId) => driveRestore(fileId));

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
    trafficLightPosition: { x: 16, y: 18 },
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
