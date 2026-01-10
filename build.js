const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Build configuration
const config = {
  name: 'VICAS',
  version: '1.0.0',
  target: 'node22-win-x64',
  entry: 'server.js',
  output: 'dist',
  binaries: {
    nport: {
      // Download from: https://github.com/tuanngocptn/nport/releases
      // Place nport executable here after download
      source: null, // Will be copied from global npm if available
      dest: 'bin/nport.exe'
    }
  }
};

// Colors for console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, colors.cyan);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

// Create dist directory structure
function createDistStructure() {
  logStep(1, 'Creating distribution directory structure...');
  
  const dirs = [
    config.output,
    path.join(config.output, 'bin'),
    path.join(config.output, 'data')
    // NOTE: public/ is now embedded in exe, not copied
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logSuccess(`Created: ${dir}`);
    }
  });
}

// Copy logo and icon to data folder for customization
function copyLogoToData() {
  logStep(2, 'Copying logo and icon to data folder...');
  
  // Copy logo.png
  const srcLogo = path.join(__dirname, 'public', 'images', 'logo.png');
  const destLogo = path.join(__dirname, config.output, 'data', 'logo.png');
  
  if (fs.existsSync(srcLogo)) {
    fs.copyFileSync(srcLogo, destLogo);
    logSuccess('Logo copied to data/');
  } else {
    logWarning('Logo not found in public/images/logo.png');
  }
  
  // Copy vicas.ico for system tray
  const srcIcon = path.join(__dirname, 'public', 'images', 'vicas.ico');
  const destIcon = path.join(__dirname, config.output, 'data', 'vicas.ico');
  
  if (fs.existsSync(srcIcon)) {
    fs.copyFileSync(srcIcon, destIcon);
    logSuccess('Icon (vicas.ico) copied to data/ for system tray');
  } else {
    logWarning('Icon not found in public/images/vicas.ico');
  }
}

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      // Skip uploads folder
      if (entry.name === 'uploads') continue;
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Build executable using @yao-pkg/pkg
function buildExecutable() {
  logStep(3, 'Building executable with @yao-pkg/pkg...');
  
  try {
    const pkgCommand = [
      'npx @yao-pkg/pkg',
      config.entry,
      `--target ${config.target}`,
      `--output ${path.join(config.output, config.name + '.exe')}`,
      '--config package.json'
    ].join(' ');
    
    log(`Running: ${pkgCommand}`, colors.yellow);
    execSync(pkgCommand, { stdio: 'inherit', cwd: __dirname });
    
    logSuccess(`Executable created: ${config.output}/${config.name}.exe`);
  } catch (error) {
    logError(`Build failed: ${error.message}`);
    throw error;
  }
}

// Copy native modules (better-sqlite3)
function copyNativeModules() {
  logStep(4, 'Copying native modules...');
  
  const betterSqlite3Path = path.join(__dirname, 'node_modules', 'better-sqlite3');
  const prebuildsPath = path.join(betterSqlite3Path, 'prebuilds');
  
  if (fs.existsSync(prebuildsPath)) {
    const destPath = path.join(__dirname, config.output, 'prebuilds');
    copyDirRecursive(prebuildsPath, destPath);
    logSuccess('Copied better-sqlite3 prebuilds');
  } else {
    logWarning('better-sqlite3 prebuilds not found. Native module may not work.');
  }
}

// Copy cloudflared.exe for tunnel
function copyCloudflared() {
  logStep(5, 'Copying cloudflared binary...');
  
  const destPath = path.join(__dirname, config.output, 'bin', 'cloudflared.exe');
  
  // Try to find cloudflared from global nport installation
  try {
    const npmRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
    const globalNportPath = path.join(npmRoot, 'nport', 'bin', 'cloudflared.exe');
    
    if (fs.existsSync(globalNportPath)) {
      fs.copyFileSync(globalNportPath, destPath);
      logSuccess('Copied cloudflared.exe from nport installation');
      return;
    }
  } catch (e) {
    // Ignore
  }
  
  // Try system cloudflared
  try {
    const which = execSync('where cloudflared', { encoding: 'utf8' }).trim().split('\n')[0];
    if (which && fs.existsSync(which)) {
      fs.copyFileSync(which, destPath);
      logSuccess('Copied cloudflared.exe from system PATH');
      return;
    }
  } catch (e) {
    // Ignore
  }
  
  logWarning('cloudflared.exe not found.');
  logWarning('Download from: https://github.com/cloudflare/cloudflared/releases');
  logWarning('Place cloudflared.exe in dist/bin/ folder');
}

// Copy systray binary for system tray functionality
function copySystrayBinary() {
  logStep(6, 'Copying systray binary...');
  
  const srcPath = path.join(__dirname, 'node_modules', 'systray2', 'traybin', 'tray_windows_release.exe');
  const destPath = path.join(__dirname, config.output, 'tray_windows_release.exe');
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    logSuccess('Copied tray_windows_release.exe for system tray');
  } else {
    logWarning('systray2 binary not found. System tray may not work.');
  }
}

// Copy nport package for bundled execution
function copyNportPackage() {
  logStep(5, 'Copying nport package...');
  
  try {
    const npmRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
    const globalNportPath = path.join(npmRoot, 'nport');
    
    if (fs.existsSync(globalNportPath)) {
      const destPath = path.join(__dirname, config.output, 'nport');
      
      // Create nport directory
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      
      // Copy essential files
      const filesToCopy = ['index.js', 'bin-manager.js', 'analytics.js', 'package.json'];
      filesToCopy.forEach(file => {
        const src = path.join(globalNportPath, file);
        const dest = path.join(destPath, file);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
        }
      });
      
      // Copy bin folder (contains cloudflared)
      const binSrc = path.join(globalNportPath, 'bin');
      const binDest = path.join(destPath, 'bin');
      if (fs.existsSync(binSrc)) {
        copyDirRecursive(binSrc, binDest);
      }
      
      // Copy node_modules for nport dependencies
      const modulesSrc = path.join(globalNportPath, 'node_modules');
      const modulesDest = path.join(destPath, 'node_modules');
      if (fs.existsSync(modulesSrc)) {
        copyDirRecursive(modulesSrc, modulesDest);
      }
      
      logSuccess('Copied nport package with cloudflared binary');
      return;
    }
  } catch (e) {
    logError(`Failed to copy nport: ${e.message}`);
  }
  
  logWarning('nport not found globally. Tunnel will not be available.');
  logWarning('Install nport globally: npm install -g nport');
}

// Create start.bat
function createLauncher() {
  logStep(7, 'Creating launcher scripts...');
  
  // Use ASCII only for maximum compatibility
  const batContent = `@echo off
title VICAS - Device Management System

echo.
echo ============================================================
echo           VICAS - HE THONG QUAN LY THIET BI Y TE
echo ============================================================
echo.

cd /d "%~dp0"

echo Starting server...
echo Press Ctrl+C to stop
echo.

VICAS.exe

pause
`;
  
  fs.writeFileSync(path.join(__dirname, config.output, 'start.bat'), batContent);
  logSuccess('Created start.bat');
}

// Create README
function createReadme() {
  logStep(8, 'Creating documentation...');
  
  // Use ASCII only for maximum compatibility
  const readmeContent = `================================================================
        VICAS - DEVICE MANAGEMENT SYSTEM
        Version ${config.version}
================================================================

=== QUICK START ===

1. Double-click "start.bat" or "VICAS.exe" to start

2. First time setup:
   - Open http://localhost:3000/setup.html
   - Configure subdomain (default: vicas-XXXXXX)
   - Create admin account

3. Access the system:
   - Local: http://localhost:3000
   - Remote: https://[subdomain].nport.link


=== FOLDER STRUCTURE ===

VICAS.exe          - Main application (all files embedded)
start.bat          - Launcher script
bin/               - Tunnel binary (cloudflared)
data/              - Database and uploads
  - devices.db     - SQLite database (auto-created)
  - uploads/       - Uploaded images
  - logo.png       - Customizable logo


=== TUNNEL INFO ===

System uses nport for tunneling:
- Default subdomain: vicas-[6 random digits]
- Public URL: https://[subdomain].nport.link
- Tunnel auto-closes after 4 hours of inactivity


=== SYSTEM REQUIREMENTS ===

- Windows 10/11 (64-bit)
- Internet connection (for tunnel)
- Visual C++ Redistributable 2015-2022 (x64)
  Download: https://aka.ms/vs/17/release/vc_redist.x64.exe
  (Required for tunnel/cloudflared to work)


=== CUSTOMIZATION ===

To change the logo:
- Replace data/logo.png with your logo
- Restart the application


=== SUPPORT ===

Contact your system administrator if you encounter issues.


================================================================
                    (C) 2026 VICAS Medical
================================================================
`;
  
  fs.writeFileSync(path.join(__dirname, config.output, 'README.txt'), readmeContent);
  logSuccess('Created README.txt');
}

// Main build function
async function build() {
  console.log('\n' + '='.repeat(60));
  log(`Building ${config.name} v${config.version}`, colors.bright + colors.cyan);
  console.log('='.repeat(60));
  
  try {
    createDistStructure();
    copyLogoToData();
    buildExecutable();
    copyNativeModules();
    copyCloudflared();
    // copySystrayBinary(); // Disabled - native modules don't work with pkg
    createLauncher();
    createReadme();
    
    console.log('\n' + '='.repeat(60));
    log('BUILD COMPLETED SUCCESSFULLY!', colors.bright + colors.green);
    console.log('='.repeat(60));
    log(`\nOutput: ${path.join(__dirname, config.output)}`, colors.cyan);
    log('\nDistribution contents:', colors.yellow);
    log('  - VICAS.exe (all code + public/ embedded)');
    log('  - bin/cloudflared.exe (tunnel binary)');
    log('  - data/logo.png, data/vicas.ico');
    log('  - start.bat, README.txt');
    log('\nTest: cd dist && VICAS.exe');
    
  } catch (error) {
    console.log('\n' + '='.repeat(60));
    logError('BUILD FAILED!');
    console.log('='.repeat(60));
    console.error(error);
    process.exit(1);
  }
}

// Run build
build();
