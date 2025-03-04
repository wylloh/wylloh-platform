/**
 * Updater Module for Seed One
 * 
 * Handles application updates by checking for new versions,
 * downloading updates, and applying them.
 */

const { dialog, shell } = require('electron');
const axios = require('axios');
const semver = require('semver');
const { app } = require('electron');
const { logger } = require('./logger');
const config = require('../config');

// Current app version
const currentVersion = app.getVersion();

/**
 * Check for application updates
 * 
 * @returns {Promise<Object>} Update information if available
 */
async function checkForUpdates() {
    try {
        logger.info(`Checking for updates. Current version: ${currentVersion}`);
        
        // Make API request to get the latest version
        const response = await axios.get(config.updates.checkUrl, {
            headers: {
                'User-Agent': `SeedOne/${currentVersion}`,
                'Accept': 'application/json'
            },
            timeout: 10000
        });
        
        if (!response.data || !response.data.version) {
            logger.warn('Update check response missing version information');
            return { hasUpdate: false };
        }
        
        const latestVersion = response.data.version;
        const updateInfo = {
            currentVersion,
            latestVersion,
            releaseNotes: response.data.releaseNotes || '',
            downloadUrl: response.data.downloadUrl || '',
            hasUpdate: semver.gt(latestVersion, currentVersion),
            isRequired: response.data.required || false
        };
        
        if (updateInfo.hasUpdate) {
            logger.info(`Update available: ${latestVersion}`);
            promptForUpdate(updateInfo);
        } else {
            logger.info('No updates available');
        }
        
        return updateInfo;
    } catch (error) {
        logger.error(`Update check failed: ${error.message}`);
        return { hasUpdate: false, error: error.message };
    }
}

/**
 * Prompt the user to update the application
 * 
 * @param {Object} updateInfo - Update information
 */
function promptForUpdate(updateInfo) {
    // Only show prompt in GUI mode
    if (!app.isPackaged || process.argv.includes('--no-update-prompt')) {
        return;
    }
    
    const dialogOptions = {
        type: 'info',
        buttons: updateInfo.isRequired 
            ? ['Download Now', 'Quit'] 
            : ['Download Now', 'Later'],
        defaultId: 0,
        title: 'Update Available',
        message: `A new version of Seed One is available!`,
        detail: `Current version: ${updateInfo.currentVersion}\nNew version: ${updateInfo.latestVersion}\n\n${updateInfo.releaseNotes}`,
        cancelId: 1
    };
    
    dialog.showMessageBox(null, dialogOptions).then((result) => {
        if (result.response === 0) {
            // User clicked "Download Now"
            downloadUpdate(updateInfo.downloadUrl);
        } else if (result.response === 1 && updateInfo.isRequired) {
            // User clicked "Quit" for a required update
            app.quit();
        }
    });
}

/**
 * Download and install the update
 * 
 * @param {string} downloadUrl - URL to download the update
 */
function downloadUpdate(downloadUrl) {
    logger.info(`Opening download URL: ${downloadUrl}`);
    
    try {
        // Open download URL in the default browser
        shell.openExternal(downloadUrl);
    } catch (error) {
        logger.error(`Failed to open download URL: ${error.message}`);
        
        // Show error dialog
        dialog.showErrorBox(
            'Update Error', 
            `Failed to open download URL: ${error.message}`
        );
    }
}

/**
 * Schedule regular update checks
 * 
 * @param {number} intervalHours - Check interval in hours
 */
function scheduleUpdateChecks(intervalHours = 24) {
    const intervalMs = intervalHours * 60 * 60 * 1000;
    
    // Check immediately on startup
    setTimeout(() => {
        checkForUpdates();
        
        // Then schedule regular checks
        setInterval(checkForUpdates, intervalMs);
    }, 1000 * 60); // Wait 1 minute after startup for initial check
}

module.exports = {
    checkForUpdates,
    scheduleUpdateChecks
};