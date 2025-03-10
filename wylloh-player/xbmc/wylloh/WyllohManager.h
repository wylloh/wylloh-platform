#pragma once
/*
 *  Copyright (C) 2023-2025 Wylloh Team
 *  This file is part of Wylloh Player - https://wylloh.com
 */

#include <string>
#include <memory>
#include <vector>
#include "settings/lib/ISettingCallback.h"
#include "threads/CriticalSection.h"
#include "wylloh/wallet/WalletManager.h"

namespace WYLLOH {

namespace WALLET {
class CWalletManager;
}

/**
 * Main manager class for all Wylloh-specific functionality
 * Serves as the central coordinator for wallet connections,
 * token verification, and content management
 */
class CWyllohManager : public ISettingCallback
{
public:
  static CWyllohManager& GetInstance();
  
  // Prevent copies
  CWyllohManager(const CWyllohManager&) = delete;
  CWyllohManager& operator=(const CWyllohManager&) = delete;
  
  /**
   * Initialize the Wylloh subsystem
   */
  bool Initialize();
  
  /**
   * Clean up on shutdown
   */
  void Shutdown();
  
  /**
   * Implementation of ISettingCallback
   */
  void OnSettingChanged(const std::shared_ptr<const CSetting>& setting) override;
  
  /**
   * Access to wallet manager
   */
  WALLET::CWalletManager* GetWalletManager() const { return m_walletManager.get(); }
  
  /**
   * Check if a piece of content is owned by the connected wallet
   * 
   * @param contentId The unique ID of the content to check
   * @return True if the content is owned, false otherwise
   */
  bool IsContentOwned(const std::string& contentId) const;

  /**
   * Get a list of all owned content IDs
   * 
   * @return Vector of content IDs
   */
  std::vector<std::string> GetOwnedContentIds() const;

  /**
   * Handle periodic updates and maintenance tasks
   * Called from the application's frame callback
   */
  void Process();

  /**
   * Set the API URL for backend integration
   * 
   * @param url The API URL
   */
  void SetApiUrl(const std::string& url);

  /**
   * Get the current API URL
   * 
   * @return The API URL as a string
   */
  std::string GetApiUrl() const;

protected:
  // Protected constructor to enforce singleton
  CWyllohManager();
  ~CWyllohManager();
  
private:
  // Managers for subsystems
  std::unique_ptr<WALLET::CWalletManager> m_walletManager;
  
  // Configuration
  std::string m_apiUrl;
  
  // Thread synchronization
  mutable CCriticalSection m_criticalSection;
  
  // State flags
  bool m_initialized{false};
};

}  // namespace WYLLOH 