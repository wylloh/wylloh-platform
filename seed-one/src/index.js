const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Store = require('electron-store');
const { setupLogging, logger } = require('./utils/logger');
const { checkForUpdates } = require('./utils/updater');
const { setupWalletConnection } = require('./wallet/connection');
const { verifyContentLicense } = require('./utils/licenseVerifier');
const { startApiServer } = require('./api/server');
const config = require('./config');

// Initialize settings store
const settings = new Store({
  name: 'seed-one-settings',
  encryptionKey: 'wylloh-seed-one'
});

// Keep a global reference of the window object
let mainWindow;
let apiServer;
let walletConnection;

// Development mode flag
const isDev = process.argv.includes('--dev');

async function createWindow() {
  // Initialize logger
  setupLogging(isDev);
  logger.info('Starting Seed One application');

  // Start the local API server for Kodi communication
  apiServer = await startApiServer();
  
  // Setup wallet connection
  walletConnection = await setupWalletConnection({
    rpcUrl: config.blockchain.rpcUrl,
    chainId: config.blockchain.chainId
  });
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../assets/icon.png')
  });

  // Load the app - either from the local UI or the web UI
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    // Open DevTools in development mode
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../ui/index.html'));
  }

  // Create application menu
  createAppMenu();

  // Check for updates
  if (!isDev) {
    checkForUpdates();
  }

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createAppMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Preferences',
          click: () => {
            // Open preferences window
            // TODO: Implement preferences window
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Wallet',
      submenu: [
        {
          label: 'Connect Wallet',
          click: async () => {
            // Connect to wallet
            const connected = await walletConnection.connect();
            if (connected) {
              logger.info('Wallet connected successfully');
            }
          }
        },
        {
          label: 'Disconnect Wallet',
          click: async () => {
            // Disconnect wallet
            await walletConnection.disconnect();
            logger.info('Wallet disconnected');
          }
        },
        { type: 'separator' },
        {
          label: 'View Tokens',
          click: async () => {
            // Show owned tokens
            // TODO: Implement token viewer
          }
        }
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Documentation',
          click: async () => {
            const { shell } = require('electron');
            await shell.openExternal('https://docs.wylloh.com');
          }
        },
        {
          label: 'About Seed One',
          click: () => {
            // Show about dialog
            // TODO: Implement about dialog
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC handlers for renderer communication
function setupIpcHandlers() {
  // Handle content playback request
  ipcMain.handle('playContent', async (event, contentId, tokenId) => {
    try {
      // Verify the user has a valid license for this content
      const hasLicense = await verifyContentLicense(walletConnection, contentId, tokenId);
      
      if (!hasLicense) {
        logger.warn(`License verification failed for content: ${contentId}`);
        return { success: false, error: 'License verification failed' };
      }
      
      // Get content details from Wylloh API
      // TODO: Implement content retrieval
      
      logger.info(`Playing content: ${contentId}`);
      return { success: true, contentUrl: 'ipfs://...' };
    } catch (error) {
      logger.error('Error playing content:', error);
      return { success: false, error: error.message };
    }
  });

  // Handle settings updates
  ipcMain.handle('updateSettings', async (event, newSettings) => {
    try {
      // Update settings
      Object.keys(newSettings).forEach(key => {
        settings.set(key, newSettings[key]);
      });
      
      logger.info('Settings updated');
      return { success: true };
    } catch (error) {
      logger.error('Error updating settings:', error);
      return { success: false, error: error.message };
    }
  });

  // Handle wallet connection
  ipcMain.handle('connectWallet', async () => {
    try {
      const result = await walletConnection.connect();
      return { success: true, address: result.address };
    } catch (error) {
      logger.error('Error connecting wallet:', error);
      return { success: false, error: error.message };
    }
  });

  // Handle wallet disconnection
  ipcMain.handle('disconnectWallet', async () => {
    try {
      await walletConnection.disconnect();
      return { success: true };
    } catch (error) {
      logger.error('Error disconnecting wallet:', error);
      return { success: false, error: error.message };
    }
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  setupIpcHandlers();
  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Handle app shutdown
app.on('before-quit', async () => {
  logger.info('Shutting down Seed One application');
  
  // Close API server
  if (apiServer) {
    await apiServer.close();
  }
  
  // Clean up wallet connection
  if (walletConnection) {
    await walletConnection.disconnect();
  }
});