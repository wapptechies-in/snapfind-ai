import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as http from "node:http";
import * as https from "node:https";
import * as path from "node:path";
import { fileURLToPath, URL } from "node:url";

const appDir = typeof __dirname !== "undefined" ? __dirname : process.cwd();

process.on("uncaughtException", (err) => {
  appendLog("FATAL", `Uncaught exception: ${err?.stack || err?.message || err}`);
});

process.on("unhandledRejection", (reason) => {
  appendLog("ERROR", `Unhandled rejection: ${reason}`);
});

const SUPPORTED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
let mainWindow: BrowserWindow | null = null;
let isScanCancelled = false;

// Ensure userData directory exists for logs and sessions
function getSessionsDir(): string {
  const dir = path.join(app.getPath("userData"), "sessions");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function getLogFilePath(): string {
  try {
    if (app && typeof app.getPath === "function") {
      return path.join(app.getPath("userData"), "snapfind-desktop.log");
    }
  } catch {
    // fallback
  }
  return path.join(process.cwd(), "snapfind-desktop.log");
}

function appendLog(level: string, message: string) {
  try {
    const timestamp = new Date().toISOString();
    // Sanitize message: remove tokens or secrets if accidentally included
    const sanitized = message
      .replace(/bearer\s+[a-zA-Z0-9_.-]+/gi, "Bearer [REDACTED]")
      .replace(/password[:=]\s*["']?[^"'\s]+["']?/gi, "password=[REDACTED]");

    const line = `[${timestamp}] [${level.toUpperCase()}] ${sanitized}\n`;
    fs.appendFileSync(getLogFilePath(), line, "utf8");
    console.log(line.trim());
  } catch (err) {
    console.error("Failed to write log line:", err);
  }
}

function computeFileSha256(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

function createWindow() {
  const iconPath = fs.existsSync(path.join(appDir, "../dist/app-logo.png"))
    ? path.join(appDir, "../dist/app-logo.png")
    : path.join(appDir, "../public/app-logo.png");

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: "#0B0D12",
    title: "SnapFind AI Desktop — Photo Processing & Upload Agent",
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      preload: path.join(appDir, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.setMenuBarVisibility(false);

  // In packaged app or production, load built index.html instantly. Only in dev with server running, load dev URL.
  const isDev = !app.isPackaged && Boolean(process.env.VITE_DEV_SERVER_URL || process.env.NODE_ENV === "development");
  const devServerUrl = isDev ? (process.env.VITE_DEV_SERVER_URL || "http://localhost:5175") : undefined;

  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
    appendLog("FATAL", `did-fail-load: code=${errorCode}, desc=${errorDescription}, url=${validatedURL}`);
  });

  mainWindow.webContents.on("did-finish-load", () => {
    appendLog("INFO", "mainWindow successfully finished loading!");
  });

  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    appendLog("FATAL", `Renderer process gone: reason=${details.reason}, exitCode=${details.exitCode}`);
  });

  const htmlPath = path.join(appDir, "../dist/index.html");
  appendLog("INFO", `Target HTML: ${htmlPath}, exists: ${fs.existsSync(htmlPath)}, isPackaged: ${app.isPackaged}`);

  if (devServerUrl) {
    appendLog("INFO", `Loading devServerUrl: ${devServerUrl}`);
    mainWindow.loadURL(devServerUrl).catch((err) => {
      appendLog("WARN", `Failed to load ${devServerUrl}, falling back to dist: ${err.message}`);
      mainWindow?.loadFile(htmlPath).catch((loadErr) => {
        appendLog("FATAL", `Fallback loadFile failed: ${loadErr.message}`);
      });
    });
  } else {
    appendLog("INFO", `Loading file: ${htmlPath}`);
    mainWindow.loadFile(htmlPath).catch((err) => {
      appendLog("FATAL", `mainWindow.loadFile failed: ${err.message}`);
    });
  }

  appendLog("INFO", `SnapFind Desktop started on platform ${process.platform} (${process.arch})`);

  mainWindow.webContents.on("console-message", (_event, level, message, line, sourceId) => {
    appendLog("RENDERER", `[Level ${level}] ${message} (${sourceId}:${line})`);
  });

  mainWindow.on("ready-to-show", () => {
    appendLog("INFO", "mainWindow ready-to-show event fired");
    mainWindow?.show();
    mainWindow?.focus();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  appendLog("INFO", "Application closed.");
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// --- IPC Handlers ---

// 1. Native Folder Dialog
ipcMain.handle("dialog:openFolder", async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
    title: "Select Photo Folder to Scan",
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

// 2. Recursive File Scanner with Streaming Progress
ipcMain.handle("scanner:scanFolder", async (_event, folderPath: string) => {
  isScanCancelled = false;
  appendLog("INFO", `Starting recursive scan of folder: ${folderPath}`);

  const files: Array<{
    filename: string;
    path: string;
    size: number;
    extension: string;
    modifiedTime: number;
    checksum?: string;
    isSupported: boolean;
    isDuplicate?: boolean;
  }> = [];

  const checksumMap = new Map<string, string>(); // checksum -> original path
  let scanned = 0;
  let supported = 0;
  let unsupported = 0;
  let duplicates = 0;
  let totalBytes = 0;

  async function walkDir(currentDir: string) {
    if (isScanCancelled) return;

    let entries: fs.Dirent[] = [];
    try {
      entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
    } catch (err) {
      appendLog("WARN", `Could not read directory ${currentDir}: ${err}`);
      return;
    }

    for (const entry of entries) {
      if (isScanCancelled) break;

      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        // Skip hidden directories like .git or .thumbnails
        if (!entry.name.startsWith(".")) {
          await walkDir(fullPath);
        }
      } else if (entry.isFile()) {
        scanned++;
        const ext = path.extname(entry.name).toLowerCase();
        const isSupported = SUPPORTED_EXTENSIONS.has(ext);

        let size = 0;
        let mtime = Date.now();
        try {
          const stats = await fs.promises.stat(fullPath);
          size = stats.size;
          mtime = stats.mtimeMs;
        } catch {
          // fallback
        }

        let isDuplicate = false;
        let checksum: string | undefined;

        if (isSupported) {
          supported++;
          totalBytes += size;

          // Compute checksum for duplicate detection
          try {
            checksum = await computeFileSha256(fullPath);
            if (checksumMap.has(checksum)) {
              duplicates++;
              isDuplicate = true;
            } else {
              checksumMap.set(checksum, fullPath);
            }
          } catch (err) {
            appendLog("WARN", `Could not compute checksum for ${entry.name}: ${err}`);
          }
        } else {
          unsupported++;
        }

        files.push({
          filename: entry.name,
          path: fullPath,
          size,
          extension: ext,
          modifiedTime: mtime,
          checksum,
          isSupported,
          isDuplicate,
        });

        // Emit progress every 20 files
        if (scanned % 20 === 0 && mainWindow) {
          mainWindow.webContents.send("scanner:progress", {
            scanned,
            supported,
            unsupported,
            duplicates,
            ready: supported - duplicates,
            totalBytes,
            currentFile: entry.name,
          });
        }
      }
    }
  }

  await walkDir(folderPath);

  appendLog(
    "INFO",
    `Scan complete: ${scanned} total, ${supported} supported, ${unsupported} unsupported, ${duplicates} duplicates`
  );

  return {
    folderPath,
    folderName: path.basename(folderPath),
    totalFiles: scanned,
    supportedCount: supported,
    unsupportedCount: unsupported,
    duplicateCount: duplicates,
    readyCount: supported - duplicates,
    totalBytes,
    files,
  };
});

ipcMain.handle("scanner:cancel", () => {
  isScanCancelled = true;
  appendLog("INFO", "Folder scan cancelled by user.");
});

// 3. Streaming Direct Binary Upload (PUT to MinIO/S3 presigned URL)
ipcMain.handle(
  "upload:streamBinary",
  async (_event, filePath: string, uploadUrl: string, contentType: string, customHeaders = {}) => {
    return new Promise((resolve) => {
      try {
        if (!fs.existsSync(filePath)) {
          resolve({ success: false, error: `File not found on disk: ${filePath}` });
          return;
        }

        const stat = fs.statSync(filePath);
        const totalBytes = stat.size;
        let bytesSent = 0;
        let targetUrl = uploadUrl;
        if (targetUrl.startsWith("/")) {
          targetUrl = `http://127.0.0.1:8000${targetUrl}`;
        }
        const parsedUrl = new URL(targetUrl);
        const isHttps = parsedUrl.protocol === "https:";
        const client = isHttps ? https : http;

        const headers: Record<string, string | number> = {
          "Content-Type": contentType || "image/jpeg",
          "Content-Length": totalBytes,
          ...customHeaders,
        };

        const options = {
          method: "PUT",
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (isHttps ? 443 : 80),
          path: `${parsedUrl.pathname}${parsedUrl.search}`,
          headers,
        };

        const req = client.request(options, (res) => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true });
          } else {
            resolve({
              success: false,
              error: `Storage upload returned HTTP status ${res.statusCode}: ${res.statusMessage}`,
            });
          }
        });

        req.on("error", (err) => {
          resolve({ success: false, error: `Upload stream error: ${err.message}` });
        });

        const fileStream = fs.createReadStream(filePath);

        fileStream.on("data", (chunk: string | Buffer) => {
          bytesSent += typeof chunk === "string" ? Buffer.byteLength(chunk) : chunk.length;
          if (mainWindow) {
            mainWindow.webContents.send(`upload:progress:${filePath}`, bytesSent, totalBytes);
          }
        });


        fileStream.on("error", (err) => {
          req.destroy(err);
          resolve({ success: false, error: `Read stream error: ${err.message}` });
        });

        fileStream.pipe(req);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        resolve({ success: false, error: `Failed to initiate upload: ${msg}` });
      }
    });
  }
);

// 4. Local Session Persistence (userData/sessions/session_<id>.json)
ipcMain.handle("storage:saveSession", async (_event, sessionData: { id: string }) => {
  try {
    if (!sessionData || !sessionData.id) return false;
    const dir = getSessionsDir();
    const filePath = path.join(dir, `session_${sessionData.id}.json`);
    const tempPath = `${filePath}.tmp`;

    // Atomic write
    await fs.promises.writeFile(tempPath, JSON.stringify(sessionData, null, 2), "utf8");
    await fs.promises.rename(tempPath, filePath);
    return true;
  } catch (err) {
    appendLog("ERROR", `Failed to save session: ${err}`);
    return false;
  }
});

ipcMain.handle("storage:loadSession", async (_event, sessionId: string) => {
  try {
    const filePath = path.join(getSessionsDir(), `session_${sessionId}.json`);
    if (!fs.existsSync(filePath)) return null;
    const content = await fs.promises.readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch (err) {
    appendLog("ERROR", `Failed to load session ${sessionId}: ${err}`);
    return null;
  }
});

ipcMain.handle("storage:listSessions", async () => {
  try {
    const dir = getSessionsDir();
    const files = await fs.promises.readdir(dir);
    const sessions = [];
    for (const f of files) {
      if (f.startsWith("session_") && f.endsWith(".json")) {
        try {
          const content = await fs.promises.readFile(path.join(dir, f), "utf8");
          sessions.push(JSON.parse(content));
        } catch {
          // ignore corrupted file
        }
      }
    }
    return sessions;
  } catch {
    return [];
  }
});

ipcMain.handle("storage:deleteSession", async (_event, sessionId: string) => {
  try {
    const filePath = path.join(getSessionsDir(), `session_${sessionId}.json`);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
    return true;
  } catch {
    return false;
  }
});

// 5. System Utilities
ipcMain.handle("shell:openExternal", async (_event, url: string) => {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    await shell.openExternal(url);
  }
});

ipcMain.handle("app:log", (_event, level: string, message: string) => {
  appendLog(level, message);
});

ipcMain.handle("app:getLogs", async () => {
  try {
    const p = getLogFilePath();
    if (!fs.existsSync(p)) return [];
    const content = await fs.promises.readFile(p, "utf8");
    return content.split("\n").filter(Boolean).slice(-200); // return last 200 lines
  } catch {
    return [];
  }
});

ipcMain.handle("app:getPlatform", () => `${process.platform} (${process.arch})`);
ipcMain.handle("app:getVersion", () => app.getVersion());
