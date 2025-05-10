// User settings service - manages user preferences for the application

// Types
export interface TokenDisplaySettings {
  showOnlyWyllohTokens: boolean;
  includeExternalProtocolTokens: boolean;
  minimumQualityLevel: number; // 0-100
}

export interface UserSettings {
  tokenDisplay: TokenDisplaySettings;
  interface: {
    darkMode: boolean;
    compactView: boolean;
  };
  notifications: {
    enablePushNotifications: boolean;
    notifyOnOwnershipChanges: boolean;
    notifyOnTransactions: boolean;
  };
  verification: {
    autoVerifyOwnership: boolean;
    verificationInterval: number; // in minutes
  };
}

// Default settings
const DEFAULT_SETTINGS: UserSettings = {
  tokenDisplay: {
    showOnlyWyllohTokens: true,
    includeExternalProtocolTokens: false,
    minimumQualityLevel: 80
  },
  interface: {
    darkMode: false,
    compactView: false
  },
  notifications: {
    enablePushNotifications: true,
    notifyOnOwnershipChanges: true,
    notifyOnTransactions: true
  },
  verification: {
    autoVerifyOwnership: true,
    verificationInterval: 60
  }
};

class UserSettingsService {
  private settings: UserSettings;
  private readonly STORAGE_KEY = 'wylloh_user_settings';
  
  constructor() {
    this.settings = this.loadSettings();
  }
  
  /**
   * Load user settings from local storage
   * @returns User settings object
   */
  private loadSettings(): UserSettings {
    try {
      const storedSettings = localStorage.getItem(this.STORAGE_KEY);
      if (storedSettings) {
        // Merge with default settings to ensure all properties exist
        return { ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) };
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
    
    return { ...DEFAULT_SETTINGS };
  }
  
  /**
   * Save current settings to local storage
   */
  private saveSettings(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving user settings:', error);
    }
  }
  
  /**
   * Get all user settings
   * @returns Full user settings object
   */
  getAllSettings(): UserSettings {
    return { ...this.settings };
  }
  
  /**
   * Get token display settings
   * @returns Token display settings
   */
  getTokenDisplaySettings(): TokenDisplaySettings {
    return { ...this.settings.tokenDisplay };
  }
  
  /**
   * Update token display settings
   * @param settings New token display settings
   */
  updateTokenDisplaySettings(settings: Partial<TokenDisplaySettings>): void {
    this.settings.tokenDisplay = {
      ...this.settings.tokenDisplay,
      ...settings
    };
    this.saveSettings();
  }
  
  /**
   * Get verification settings
   * @returns Verification settings
   */
  getVerificationSettings(): UserSettings['verification'] {
    return { ...this.settings.verification };
  }
  
  /**
   * Update verification settings
   * @param settings New verification settings
   */
  updateVerificationSettings(settings: Partial<UserSettings['verification']>): void {
    this.settings.verification = {
      ...this.settings.verification,
      ...settings
    };
    this.saveSettings();
  }
  
  /**
   * Update notification settings
   * @param settings New notification settings
   */
  updateNotificationSettings(settings: Partial<UserSettings['notifications']>): void {
    this.settings.notifications = {
      ...this.settings.notifications,
      ...settings
    };
    this.saveSettings();
  }
  
  /**
   * Update interface settings
   * @param settings New interface settings
   */
  updateInterfaceSettings(settings: Partial<UserSettings['interface']>): void {
    this.settings.interface = {
      ...this.settings.interface,
      ...settings
    };
    this.saveSettings();
  }
  
  /**
   * Reset all settings to defaults
   */
  resetSettings(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    this.saveSettings();
  }
}

// Create and export singleton instance
export const userSettingsService = new UserSettingsService();
export default userSettingsService; 