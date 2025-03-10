#pragma once
/*
 *  Copyright (C) 2023-2025 Wylloh Team
 *  This file is part of Wylloh Player - https://wylloh.com
 */

#include <string>
#include <vector>
#include <map>
#include <mutex>
#include "threads/CriticalSection.h"

namespace WYLLOH {
namespace WALLET {

/**
 * Class to handle wallet connection and API communication
 * Communicates with the Wylloh API for wallet connections and token verification
 */
class CWalletConnection
{
public:
  /**
   * Connection status enum for tracking connection state
   */
  enum class ConnectionStatus
  {
    Disconnected,
    Connecting,
    Connected,
    Error
  };

  /**
   * Connection response struct for tracking connection results
   */
  struct ConnectionResponse
  {
    bool success = false;
    std::string message;
    std::string address;
    std::string connectionUrl;
    std::string sessionId;
    bool autoConnected = false;
  };

  /**
   * Token struct for representing owned tokens
   */
  struct Token
  {
    std::string id;
    std::string contentId;
    std::string contentType;
    std::string metadataUrl;
    std::string name;
    std::map<std::string, std::string> attributes;
  };

  CWalletConnection();
  ~CWalletConnection();

  /**
   * Initialize the wallet connection
   * 
   * @param apiUrl The API URL to use
   * @return True if initialization was successful
   */
  bool Initialize(const std::string& apiUrl);

  /**
   * Shutdown the wallet connection
   */
  void Shutdown();

  /**
   * Connect to wallet
   * 
   * @return Connection response
   */
  ConnectionResponse Connect();

  /**
   * Initiate QR code connection process
   * 
   * @return Connection response with QR code URL
   */
  ConnectionResponse InitiateQRConnection();

  /**
   * Check status of QR code connection
   * 
   * @param sessionId Session ID from InitiateQRConnection
   * @return Connection response
   */
  ConnectionResponse CheckQRConnectionStatus(const std::string& sessionId);

  /**
   * Complete QR code connection process
   * 
   * @param sessionId Session ID from InitiateQRConnection
   * @return Connection response
   */
  ConnectionResponse CompleteQRConnection(const std::string& sessionId);

  /**
   * Auto-connect to previously connected wallet
   * 
   * @return Connection response
   */
  ConnectionResponse AutoConnect();

  /**
   * Disconnect wallet
   * 
   * @return True if disconnected successfully
   */
  bool Disconnect();

  /**
   * Get connection status
   * 
   * @return Current connection status
   */
  ConnectionStatus GetConnectionStatus() const;

  /**
   * Get connected wallet address
   * 
   * @return Wallet address, empty if not connected
   */
  std::string GetAddress() const;

  /**
   * Set API URL
   * 
   * @param url The API URL to use
   */
  void SetApiUrl(const std::string& url);

  /**
   * Check if a specific content is owned
   * 
   * @param contentId The content ID to check
   * @return True if content is owned by connected wallet
   */
  bool IsContentOwned(const std::string& contentId) const;

  /**
   * Get all owned content IDs
   * 
   * @return Vector of content IDs
   */
  std::vector<std::string> GetOwnedContentIds() const;

  /**
   * Get all owned tokens
   * 
   * @return Vector of owned tokens
   */
  std::vector<Token> GetOwnedTokens() const;

  /**
   * Refresh token data from API
   * 
   * @return True if refresh was successful
   */
  bool RefreshTokenData();

  /**
   * Get error message from last operation
   * 
   * @return Error message
   */
  std::string GetLastError() const;

private:
  /**
   * Make API request to Wylloh backend
   * 
   * @param endpoint API endpoint
   * @param method HTTP method (GET, POST, etc.)
   * @param data Optional request data for POST/PUT
   * @return Response as string
   */
  std::string MakeApiRequest(const std::string& endpoint, 
                           const std::string& method = "GET",
                           const std::string& data = "");

  /**
   * Save wallet state to persistent storage
   */
  void SaveWalletState();

  /**
   * Load wallet state from persistent storage
   */
  bool LoadWalletState();

  // Configuration
  std::string m_apiUrl;
  std::string m_walletDataPath;
  
  // Current state
  ConnectionStatus m_connectionStatus;
  std::string m_address;
  std::vector<Token> m_tokens;
  std::string m_lastError;
  
  // Thread synchronization
  mutable CCriticalSection m_criticalSection;
};

}  // namespace WALLET
}  // namespace WYLLOH 