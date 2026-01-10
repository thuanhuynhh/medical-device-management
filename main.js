/**
 * VICAS Device Management - Electron Main Process
 * Wraps Express server with native system tray support
 */

const { app, BrowserWindow, Tray, Menu, shell, dialog } = require('electron');
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
let tray = null;
let serverProcess = null;
let isQuitting = false;
let tunnelUrl = null;

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

// Start Express server
function startServer() {
  return new Promise((resolve, reject) => {
    const serverPath = path.join(__dirname, 'server.js');
    
    console.log('Starting Express server...');
    
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
      console.log('[Server]', output.trim());
      
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
      console.error('[Server Error]', data.toString().trim());
    });
    
    serverProcess.on('error', (err) => {
      console.error('Failed to start server:', err);
      reject(err);
    });
    
    serverProcess.on('exit', (code) => {
      console.log('Server exited with code:', code);
      if (!isQuitting) {
        dialog.showErrorBox('Server Error', 'Server đã dừng bất ngờ. Ứng dụng sẽ đóng.');
        app.quit();
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

// Stop server
function stopServer() {
  if (serverProcess) {
    console.log('Stopping server...');
    serverProcess.kill('SIGTERM');
    serverProcess = null;
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
        isQuitting = true;
        app.quit();
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
  
  // Start server first
  try {
    await startServer();
    console.log('Server started successfully');
  } catch (err) {
    console.error('Failed to start server:', err);
  }
  
  // Create tray and window
  createTray();
  createWindow();
  
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
