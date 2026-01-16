/**
 * VICAS Device Management - Electron Main Process
 * Wraps Express server with native system tray support
 */

const { app, BrowserWindow, Tray, Menu, shell, dialog, ipcMain } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const fs = require('fs');

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

// Configuration
const PORT = 3000;
const APP_NAME = 'Quan ly thiet bi y te - VICAS.vn';

// State
let mainWindow = null;
let logWindow = null;
let tray = null;
let serverProcess = null;
let isQuitting = false;
let tunnelUrl = null;
let serverLogs = [];
const MAX_LOG_LINES = 1000;

// Get icon path
function getIconPath() {
  const iconName = process.platform === 'win32' ? 'vicas.ico' : 'icon.png';
  
  // In development
  if (!app.isPackaged) {
    return path.join(__dirname, 'public', 'images', 'vicas.ico');
  }
  
  // In production (packaged)
  const possiblePaths = [
    path.join(process.resourcesPath, 'data', 'vicas.ico'),
    path.join(__dirname, 'public', 'images', 'vicas.ico'),
    path.join(app.getPath('exe'), '..', 'resources', 'data', 'vicas.ico')
  ];
  
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  
  return null;
}

// Log file config
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB

function getLogPath() {
  const baseDir = app.isPackaged ? path.dirname(process.execPath) : __dirname;
  return path.join(baseDir, 'logs', 'app.log');
}

function logToFile(entry) {
  try {
    const logPath = getLogPath();
    const logDir = path.dirname(logPath);
    
    // Ensure directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Check size and rotate if needed
    if (fs.existsSync(logPath)) {
      const stats = fs.statSync(logPath);
      if (stats.size >= MAX_LOG_SIZE) {
        const backupPath = logPath + '.old';
        try {
          if (fs.existsSync(backupPath)) {
            fs.unlinkSync(backupPath);
          }
          fs.renameSync(logPath, backupPath);
        } catch (e) {
          console.error('Failed to rotate log:', e);
        }
      }
    }

    // Append to file
    fs.appendFileSync(logPath, entry + '\n', 'utf8');
  } catch (e) {
    console.error('Failed to write to log file:', e);
  }
}

function addLog(message, type = 'info') {
  const timestamp = new Date().toLocaleString();
  const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
  
  // Write to file
  logToFile(logEntry);
  
  // Storage in memory
  serverLogs.push(logEntry);
  if (serverLogs.length > MAX_LOG_LINES) {
    serverLogs.shift();
  }
  
  // Send to log window if open
  if (logWindow && !logWindow.isDestroyed()) {
    logWindow.webContents.send('new-log', logEntry);
  }
}

// Start Express server
function startServer() {
  return new Promise((resolve, reject) => {
    // Kill existing if any
    if (serverProcess) {
      try {
        process.kill(serverProcess.pid);
      } catch (e) {
        // Ignore
      }
      serverProcess = null;
    }

    const serverPath = path.join(__dirname, 'server.js');
    
    addLog('Starting Express server...', 'info');
    
    serverProcess = spawn(process.execPath, [serverPath], {
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1'
      }
    });
    
    let serverReady = false;
    
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      addLog(output.trim(), 'stdout');
      
      // Check for server ready signal
      if (output.includes('Server is ready') || output.includes('localhost:' + PORT)) {
        serverReady = true;
        resolve();
      }
      
      // Capture tunnel URL
      if (output.includes('.nport.link')) {
        const match = output.match(/https:\/\/[^\s]+\.nport\.link/);
        if (match) {
          tunnelUrl = match[0];
          updateTrayMenu();
        }
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      addLog(data.toString().trim(), 'stderr');
    });
    
    serverProcess.on('error', (err) => {
      addLog('Failed to start server: ' + err.message, 'error');
      reject(err);
    });
    
    serverProcess.on('exit', (code) => {
      addLog('Server exited with code: ' + code, 'warn');
      if (!isQuitting && code !== 0 && code !== null) {
        // dialog.showErrorBox('Server Error', 'Server đã dừng bất ngờ.');
      }
    });
    
    // Timeout for server start
    setTimeout(() => {
      if (!serverReady) {
        resolve(); // Proceed anyway
      }
    }, 10000);
  });
}

// Restart server
async function restartServer() {
  addLog('Restarting server...', 'info');
  stopServer();
  // Wait a bit
  setTimeout(async () => {
    try {
      await startServer();
      dialog.showMessageBox({
        type: 'info',
        title: 'Thành công',
        message: 'Đã khởi động lại server thành công',
        buttons: ['OK']
      });
    } catch (err) {
      dialog.showErrorBox('Lỗi', 'Không thể khởi động lại server: ' + err.message);
    }
  }, 1000);
}

// Stop server
function stopServer() {
  if (serverProcess) {
    addLog('Stopping server...', 'info');
    serverProcess.kill('SIGTERM');
    serverProcess = null;
    tunnelUrl = null;
    updateTrayMenu();
  }
}

// Check if startup is enabled
function isStartupEnabled() {
  try {
    const { execSync } = require('child_process');
    const result = execSync(
      `reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "${APP_NAME}"`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    return result.includes(APP_NAME);
  } catch (e) {
    return false;
  }
}

// Toggle startup
function toggleStartup() {
  const exePath = app.getPath('exe');
  const regKey = `HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run`;
  
  if (isStartupEnabled()) {
    exec(`reg delete "${regKey}" /v "${APP_NAME}" /f`, (err) => {
      if (!err) {
        updateTrayMenu();
      }
    });
  } else {
    exec(`reg add "${regKey}" /v "${APP_NAME}" /t REG_SZ /d "${exePath}" /f`, (err) => {
      if (!err) {
        updateTrayMenu();
      }
    });
  }
}

// Create log window
function createLogWindow() {
  if (logWindow && !logWindow.isDestroyed()) {
    logWindow.show();
    logWindow.focus();
    return;
  }

  logWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: 'Server Logs',
    icon: getIconPath(),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Server Logs</title>
      <style>
        body { background: #1e1e1e; color: #d4d4d4; font-family: Consolas, monospace; padding: 10px; margin: 0; }
        #logs { white-space: pre-wrap; word-wrap: break-word; }
        .log-entry { margin-bottom: 2px; border-bottom: 1px solid #333; padding: 2px 0; }
        .stderr { color: #f48771; }
        .error { color: #f44336; font-weight: bold; }
        .warn { color: #cca700; }
        .info { color: #89d185; }
        .stdout { color: #d4d4d4; }
      </style>
    </head>
    <body>
      <div id="logs"></div>
      <script>
        const { ipcRenderer } = require('electron');
        const logsDiv = document.getElementById('logs');
        
        function addLog(msg) {
          const div = document.createElement('div');
          div.className = 'log-entry';
          
          if(msg.includes('[STDERR]')) div.classList.add('stderr');
          else if(msg.includes('[ERROR]')) div.classList.add('error');
          else if(msg.includes('[WARN]')) div.classList.add('warn');
          else if(msg.includes('[INFO]')) div.classList.add('info');
          else div.classList.add('stdout');
          
          div.textContent = msg;
          logsDiv.appendChild(div);
          window.scrollTo(0, document.body.scrollHeight);
        }

        // Load history
        const history = ${JSON.stringify(serverLogs)};
        history.forEach(addLog);

        ipcRenderer.on('new-log', (event, msg) => {
          addLog(msg);
        });
      </script>
    </body>
    </html>
  `;

  logWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));

  logWindow.on('closed', () => {
    logWindow = null;
  });
}


// Create tray menu
function createTrayMenu() {
  const startupEnabled = isStartupEnabled();
  
  return Menu.buildFromTemplate([
    {
      label: '🌐 Mở trang web (Local)',
      click: () => {
        shell.openExternal(`http://localhost:${PORT}`);
      }
    },
    {
      label: tunnelUrl ? '🔗 Mở URL công khai' : '🔗 Tunnel chưa kết nối',
      enabled: !!tunnelUrl,
      click: () => {
        if (tunnelUrl) {
          shell.openExternal(tunnelUrl);
        }
      }
    },
    { type: 'separator' },
    {
      label: '📋 Xem Log Server',
      click: () => {
        createLogWindow();
      }
    },
    {
      label: '🔄 Khởi động lại Server',
      click: () => {
        // Confirmation
        dialog.showMessageBox({
            type: 'question',
            buttons: ['Hủy', 'Khởi động lại'],
            title: 'Xác nhận',
            message: 'Bạn có chắc chắn muốn khởi động lại server không?',
            defaultId: 0,
            cancelId: 0
        }).then(result => {
            if (result.response === 1) {
                restartServer();
            }
        });
      }
    },
    { type: 'separator' },
    {
      label: startupEnabled ? '✓ Khởi động cùng Windows' : '☐ Khởi động cùng Windows',
      click: () => {
        toggleStartup();
      }
    },
    { type: 'separator' },
    {
      label: '📊 Dashboard',
      click: () => {
        shell.openExternal(`http://localhost:${PORT}/dashboard.html`);
      }
    },
    {
      label: '⚙️ Cài đặt',
      click: () => {
        shell.openExternal(`http://localhost:${PORT}/settings.html`);
      }
    },
    { type: 'separator' },
    {
      label: '🚪 Thoát',
      click: () => {
        // Confirm exit
        dialog.showMessageBox({
          type: 'question',
          buttons: ['Hủy', 'Thoát'],
          title: 'Xác nhận',
          message: 'Bạn có chắc chắn muốn thoát ứng dụng không?\nServer sẽ bị dừng.',
          defaultId: 0,
          cancelId: 0
      }).then(result => {
          if (result.response === 1) {
              isQuitting = true;
              app.quit();
          }
      });
      }
    }
  ]);
}

// Update tray menu
function updateTrayMenu() {
  if (tray) {
    tray.setContextMenu(createTrayMenu());
  }
}

// Create system tray
function createTray() {
  const iconPath = getIconPath();
  
  if (!iconPath) {
    console.error('Tray icon not found');
    return;
  }
  
  tray = new Tray(iconPath);
  tray.setToolTip(APP_NAME);
  tray.setContextMenu(createTrayMenu());
  
  // Double click to open browser
  tray.on('double-click', () => {
    shell.openExternal(`http://localhost:${PORT}`);
  });
  
  console.log('System tray created');
}

// Create hidden window (needed for some Electron features)
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1,
    height: 1,
    show: false,
    webPreferences: {
      nodeIntegration: false
    }
  });
  
  mainWindow.loadURL('about:blank');
  
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

// App ready
app.whenReady().then(async () => {
  console.log('Electron starting...');
  
  // Create tray and window
  createTray();
  createWindow();
  
  // Start server first
  try {
    await startServer();
    console.log('Server started successfully');
  } catch (err) {
    console.error('Failed to start server:', err);
  }
  
  // Open browser on first run - check if setup is needed
  setTimeout(async () => {
    try {
      // Check setup status via API
      const http = require('http');
      const checkSetup = () => new Promise((resolve) => {
        http.get(`http://localhost:${PORT}/api/setup/status`, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              resolve(json.needsSetup);
            } catch (e) {
              resolve(false);
            }
          });
        }).on('error', () => resolve(false));
      });
      
      const needsSetup = await checkSetup();
      if (needsSetup) {
        shell.openExternal(`http://localhost:${PORT}/setup.html`);
      } else {
        shell.openExternal(`http://localhost:${PORT}`);
      }
    } catch (e) {
      // Fallback to root
      shell.openExternal(`http://localhost:${PORT}`);
    }
  }, 2000);
});

// Handle second instance
app.on('second-instance', () => {
  shell.openExternal(`http://localhost:${PORT}`);
});

// Cleanup on quit
app.on('before-quit', () => {
  isQuitting = true;
  stopServer();
});

app.on('window-all-closed', () => {
  // Keep running in tray
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
