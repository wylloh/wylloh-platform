#pragma once
/*
 *  Copyright (C) 2023-2025 Wylloh Team
 *  This file is part of Wylloh Player - https://wylloh.com
 */

#include <string>
#include <vector>
#include <memory>
#include <mutex>
#include "threads/CriticalSection.h"
#include "threads/Event.h"
#include "wylloh/wallet/WalletConnection.h"
#include "wylloh/wallet/WalletOverlay.h"

namespace WYLLOH {
namespace WALLET {

/**
 * Manages wallet connections and interactions
 * Coordinates between UI, wallet connection, and content verification
 */
class CWalletManager
{
public:
  CWalletManager();
  ~CWalletManager();

  /**
   * Initialize the wallet manager
   */
  bool Initialize();

  /**
   * Shutdown the wallet manager
   */
  void Shutdown();

  /**
   * Connect to wallet using QR code
   * This will display a QR code dialog for the user to scan
   * 
   * @return True if connection was successful
   */
  bool ConnectWalletWithQR();

  /**
   * Connect to wallet automatically if possible
   * This will attempt to reconnect to a previously connected wallet
   * 
   * @return True if connection was successful
   */
  bool AutoConnectWallet();

  /**
   * Disconnect from wallet
   * 
   * @return True if disconnection was successful
   */
  bool DisconnectWallet();

  /**
   * Check if a wallet is currently connected
   * 
   * @return True if connected
   */
  bool IsConnected() const;

  /**
   * Get the connected wallet address
   * 
   * @return Wallet address as string, empty if not connected
   */
  std::string GetWalletAddress() const;

  /**
   * Verify ownership of a specific content ID
   * 
   * @param contentId The content ID to verify
   * @return True if the connected wallet owns this content
   */
  bool VerifyContentOwnership(const std::string& contentId) const;

  /**
   * Get a list of all content IDs owned by the connected wallet
   * 
   * @return Vector of content IDs
   */
  std::vector<std::string> GetOwnedContentIds() const;

  /**
   * Set the API URL
   * 
   * @param url The API URL to use for wallet communications
   */
  void SetApiUrl(const std::string& url);

  /**
   * Process wallet manager (called regularly)
   * Handles updates, connection status checks, etc.
   */
  void Process();

  /**
   * Show wallet overlay on screen
   * 
   * @param show Whether to show or hide the overlay
   */
  void ShowWalletOverlay(bool show);

  /**
   * Set blockchain provider URL
   * 
   * @param url The provider URL (e.g., http://localhost:8545)
   */
  void SetProviderUrl(const std::string& url);
  
  /**
   * Set smart contract address
   * 
   * @param address The contract address
   */
  void SetContractAddress(const std::string& address);
  
  /**
   * Enable demo mode for offline/local testing
   * 
   * @param enabled Whether demo mode should be enabled
   */
  void EnableDemoMode(bool enabled);

private:
  // Wallet connection
  std::unique_ptr<CWalletConnection> m_walletConnection;
  
  // Wallet overlay UI
  std::unique_ptr<CWalletOverlay> m_walletOverlay;
  
  // Configuration
  std::string m_apiUrl;
  
  // Thread synchronization
  mutable CCriticalSection m_criticalSection;
  CEvent m_connectionEvent;
  
  // State flags
  bool m_initialized{false};
};

}  // namespace WALLET
}  // namespace WYLLOH 