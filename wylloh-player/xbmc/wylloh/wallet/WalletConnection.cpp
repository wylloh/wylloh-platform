/*
 *  Copyright (C) 2023-2025 Wylloh Team
 *  This file is part of Wylloh Player - https://wylloh.com
 */

#include "wylloh/wallet/WalletConnection.h"
#include "filesystem/File.h"
#include "filesystem/SpecialProtocol.h"
#include "utils/log.h"
#include "utils/JSONVariantParser.h"
#include "utils/JSONVariantWriter.h"
#include "utils/Variant.h"
#include "network/Network.h"
#include "ServiceBroker.h"
#include "Application.h"
#include "URL.h"
#include "Util.h"

#include <cstdlib>
#include <ctime>
#include <random>
#include <iostream>
#include <sstream>
#include <thread>
#include <chrono>

namespace WYLLOH {
namespace WALLET {

// Default wallet data path for persistent storage
#define DEFAULT_WALLET_DATA_PATH "special://userdata/wylloh/"
#define WALLET_STATE_FILE "wallet_state.json"

CWalletConnection::CWalletConnection()
  : m_apiUrl("http://localhost:3333/api/"),
    m_connectionStatus(ConnectionStatus::Disconnected),
    m_address(""),
    m_lastError("")
{
  // Set data path
  m_walletDataPath = CSpecialProtocol::TranslatePath(DEFAULT_WALLET_DATA_PATH);

  // Create directory if it doesn't exist
  if (!XFILE::CDirectory::Exists(m_walletDataPath))
  {
    XFILE::CDirectory::Create(m_walletDataPath);
  }

  // Initialize random seed
  std::srand(static_cast<unsigned int>(std::time(nullptr)));
}

CWalletConnection::~CWalletConnection()
{
  // Save state before destruction
  SaveWalletState();
}

bool CWalletConnection::Initialize(const std::string& apiUrl)
{
  CSingleLock lock(m_criticalSection);

  // Set API URL
  if (!apiUrl.empty())
  {
    m_apiUrl = apiUrl;
    
    // Ensure URL ends with /
    if (m_apiUrl.back() != '/')
      m_apiUrl += '/';
  }

  // Try to load saved wallet state
  LoadWalletState();

  CLog::Log(LOGINFO, "WYLLOH: Wallet connection initialized with API URL: %s", m_apiUrl.c_str());
  return true;
}

void CWalletConnection::Shutdown()
{
  CSingleLock lock(m_criticalSection);

  // Disconnect wallet if connected
  if (m_connectionStatus == ConnectionStatus::Connected)
  {
    Disconnect();
  }

  // Save current state
  SaveWalletState();

  CLog::Log(LOGINFO, "WYLLOH: Wallet connection shut down");
}

CWalletConnection::ConnectionResponse CWalletConnection::Connect()
{
  CSingleLock lock(m_criticalSection);

  ConnectionResponse response;

  if (m_connectionStatus == ConnectionStatus::Connected)
  {
    // Already connected
    response.success = true;
    response.address = m_address;
    return response;
  }

  // Update status
  m_connectionStatus = ConnectionStatus::Connecting;

  try
  {
    // Prepare JSON data
    CVariant requestData(CVariant::VariantTypeObject);
    
    // Make request to wallet/connect endpoint
    std::string result = MakeApiRequest("wallet/connect", "POST", 
                                      CJSONVariantWriter::Write(requestData, true));
    
    if (!result.empty())
    {
      CVariant resultObj;
      if (CJSONVariantParser::Parse(result, resultObj))
      {
        if (resultObj.isMember("success") && resultObj["success"].asBoolean())
        {
          // Connection successful
          response.success = true;
          
          if (resultObj.isMember("address"))
            response.address = resultObj["address"].asString();
            
          if (resultObj.isMember("message"))
            response.message = resultObj["message"].asString();
            
          // Update state
          m_connectionStatus = ConnectionStatus::Connected;
          m_address = response.address;
          
          // Refresh token data
          RefreshTokenData();
          
          // Save state
          SaveWalletState();
          
          CLog::Log(LOGINFO, "WYLLOH: Wallet connected: %s", m_address.c_str());
        }
        else
        {
          // Connection failed
          response.success = false;
          if (resultObj.isMember("message"))
            response.message = resultObj["message"].asString();
            
          m_connectionStatus = ConnectionStatus::Error;
          m_lastError = response.message;
          
          CLog::Log(LOGERROR, "WYLLOH: Failed to connect wallet: %s", response.message.c_str());
        }
      }
      else
      {
        // Parse error
        response.success = false;
        response.message = "Invalid response format";
        m_connectionStatus = ConnectionStatus::Error;
        m_lastError = "Invalid API response format";
        
        CLog::Log(LOGERROR, "WYLLOH: Failed to parse wallet connect response");
      }
    }
    else
    {
      // Empty response
      response.success = false;
      response.message = "No response from API";
      m_connectionStatus = ConnectionStatus::Error;
      m_lastError = "No response from wallet API";
      
      CLog::Log(LOGERROR, "WYLLOH: No response from wallet API");
    }
  }
  catch (const std::exception& e)
  {
    // Exception occurred
    response.success = false;
    response.message = e.what();
    m_connectionStatus = ConnectionStatus::Error;
    m_lastError = e.what();
    
    CLog::Log(LOGERROR, "WYLLOH: Exception in wallet connect: %s", e.what());
  }

  return response;
}

CWalletConnection::ConnectionResponse CWalletConnection::InitiateQRConnection()
{
  CSingleLock lock(m_criticalSection);

  ConnectionResponse response;

  if (m_connectionStatus == ConnectionStatus::Connected)
  {
    // Already connected
    response.success = true;
    response.address = m_address;
    return response;
  }

  // Update status
  m_connectionStatus = ConnectionStatus::Connecting;

  try
  {
    // Generate a unique session ID
    std::stringstream ss;
    ss << std::hex << std::rand() << std::rand() << std::rand();
    std::string sessionId = ss.str();
    
    // Prepare JSON data
    CVariant requestData(CVariant::VariantTypeObject);
    requestData["sessionId"] = sessionId;
    
    // Make request to wallet/qr-connect endpoint
    std::string result = MakeApiRequest("wallet/qr-connect", "POST", 
                                      CJSONVariantWriter::Write(requestData, true));
    
    if (!result.empty())
    {
      CVariant resultObj;
      if (CJSONVariantParser::Parse(result, resultObj))
      {
        if (resultObj.isMember("success") && resultObj["success"].asBoolean())
        {
          // Initiation successful
          response.success = true;
          response.sessionId = sessionId;
          
          if (resultObj.isMember("connectionUrl"))
            response.connectionUrl = resultObj["connectionUrl"].asString();
            
          if (resultObj.isMember("message"))
            response.message = resultObj["message"].asString();
            
          CLog::Log(LOGINFO, "WYLLOH: QR connection initiated, session: %s", sessionId.c_str());
        }
        else
        {
          // Initiation failed
          response.success = false;
          if (resultObj.isMember("message"))
            response.message = resultObj["message"].asString();
            
          m_connectionStatus = ConnectionStatus::Error;
          m_lastError = response.message;
          
          CLog::Log(LOGERROR, "WYLLOH: Failed to initiate QR connection: %s", response.message.c_str());
        }
      }
      else
      {
        // Parse error
        response.success = false;
        response.message = "Invalid response format";
        m_connectionStatus = ConnectionStatus::Error;
        m_lastError = "Invalid API response format";
        
        CLog::Log(LOGERROR, "WYLLOH: Failed to parse QR connect response");
      }
    }
    else
    {
      // Empty response
      response.success = false;
      response.message = "No response from API";
      m_connectionStatus = ConnectionStatus::Error;
      m_lastError = "No response from wallet API";
      
      CLog::Log(LOGERROR, "WYLLOH: No response from wallet API");
    }
  }
  catch (const std::exception& e)
  {
    // Exception occurred
    response.success = false;
    response.message = e.what();
    m_connectionStatus = ConnectionStatus::Error;
    m_lastError = e.what();
    
    CLog::Log(LOGERROR, "WYLLOH: Exception in QR connect: %s", e.what());
  }

  return response;
}

CWalletConnection::ConnectionResponse CWalletConnection::CheckQRConnectionStatus(const std::string& sessionId)
{
  CSingleLock lock(m_criticalSection);

  ConnectionResponse response;

  try
  {
    // Make request to wallet/qr-status endpoint
    std::string endpoint = "wallet/qr-status/" + sessionId;
    std::string result = MakeApiRequest(endpoint, "GET");
    
    if (!result.empty())
    {
      CVariant resultObj;
      if (CJSONVariantParser::Parse(result, resultObj))
      {
        response.success = true;
        
        if (resultObj.isMember("connected"))
          response.success = resultObj["connected"].asBoolean();
          
        if (resultObj.isMember("address"))
          response.address = resultObj["address"].asString();
            
        if (resultObj.isMember("message"))
          response.message = resultObj["message"].asString();
            
        CLog::Log(LOGDEBUG, "WYLLOH: QR connection status checked, connected: %s", 
                 response.success ? "true" : "false");
      }
      else
      {
        // Parse error
        response.success = false;
        response.message = "Invalid response format";
        
        CLog::Log(LOGERROR, "WYLLOH: Failed to parse QR status response");
      }
    }
    else
    {
      // Empty response
      response.success = false;
      response.message = "No response from API";
      
      CLog::Log(LOGERROR, "WYLLOH: No response from wallet API for QR status");
    }
  }
  catch (const std::exception& e)
  {
    // Exception occurred
    response.success = false;
    response.message = e.what();
    
    CLog::Log(LOGERROR, "WYLLOH: Exception in QR status check: %s", e.what());
  }

  return response;
}

CWalletConnection::ConnectionResponse CWalletConnection::CompleteQRConnection(const std::string& sessionId)
{
  CSingleLock lock(m_criticalSection);

  ConnectionResponse response;

  try
  {
    // Prepare JSON data
    CVariant requestData(CVariant::VariantTypeObject);
    requestData["sessionId"] = sessionId;
    
    // Make request to wallet/qr-complete endpoint
    std::string result = MakeApiRequest("wallet/qr-complete", "POST", 
                                      CJSONVariantWriter::Write(requestData, true));
    
    if (!result.empty())
    {
      CVariant resultObj;
      if (CJSONVariantParser::Parse(result, resultObj))
      {
        if (resultObj.isMember("success") && resultObj["success"].asBoolean())
        {
          // Connection successful
          response.success = true;
          
          if (resultObj.isMember("address"))
            response.address = resultObj["address"].asString();
            
          if (resultObj.isMember("message"))
            response.message = resultObj["message"].asString();
            
          // Update state
          m_connectionStatus = ConnectionStatus::Connected;
          m_address = response.address;
          
          // Refresh token data
          RefreshTokenData();
          
          // Save state
          SaveWalletState();
          
          CLog::Log(LOGINFO, "WYLLOH: QR connection completed, wallet: %s", m_address.c_str());
        }
        else
        {
          // Connection failed
          response.success = false;
          if (resultObj.isMember("message"))
            response.message = resultObj["message"].asString();
            
          m_connectionStatus = ConnectionStatus::Error;
          m_lastError = response.message;
          
          CLog::Log(LOGERROR, "WYLLOH: Failed to complete QR connection: %s", response.message.c_str());
        }
      }
      else
      {
        // Parse error
        response.success = false;
        response.message = "Invalid response format";
        m_connectionStatus = ConnectionStatus::Error;
        m_lastError = "Invalid API response format";
        
        CLog::Log(LOGERROR, "WYLLOH: Failed to parse QR connect completion response");
      }
    }
    else
    {
      // Empty response
      response.success = false;
      response.message = "No response from API";
      m_connectionStatus = ConnectionStatus::Error;
      m_lastError = "No response from wallet API";
      
      CLog::Log(LOGERROR, "WYLLOH: No response from wallet API for QR completion");
    }
  }
  catch (const std::exception& e)
  {
    // Exception occurred
    response.success = false;
    response.message = e.what();
    m_connectionStatus = ConnectionStatus::Error;
    m_lastError = e.what();
    
    CLog::Log(LOGERROR, "WYLLOH: Exception in QR connect completion: %s", e.what());
  }

  return response;
}

CWalletConnection::ConnectionResponse CWalletConnection::AutoConnect()
{
  CSingleLock lock(m_criticalSection);

  ConnectionResponse response;

  // If already connected, return success
  if (m_connectionStatus == ConnectionStatus::Connected)
  {
    response.success = true;
    response.address = m_address;
    response.autoConnected = true;
    return response;
  }

  // If no saved address, can't auto-connect
  if (m_address.empty())
  {
    response.success = false;
    response.message = "No saved wallet address";
    return response;
  }

  // Update status
  m_connectionStatus = ConnectionStatus::Connecting;

  try
  {
    // Prepare JSON data
    CVariant requestData(CVariant::VariantTypeObject);
    requestData["address"] = m_address;
    
    // Make request to wallet/auto-connect endpoint
    std::string result = MakeApiRequest("wallet/auto-connect", "POST", 
                                      CJSONVariantWriter::Write(requestData, true));
    
    if (!result.empty())
    {
      CVariant resultObj;
      if (CJSONVariantParser::Parse(result, resultObj))
      {
        if (resultObj.isMember("success") && resultObj["success"].asBoolean())
        {
          // Auto-connection successful
          response.success = true;
          response.autoConnected = true;
          
          if (resultObj.isMember("address"))
            response.address = resultObj["address"].asString();
            
          if (resultObj.isMember("message"))
            response.message = resultObj["message"].asString();
            
          // Update state
          m_connectionStatus = ConnectionStatus::Connected;
          
          // Refresh token data
          RefreshTokenData();
          
          CLog::Log(LOGINFO, "WYLLOH: Wallet auto-connected: %s", m_address.c_str());
        }
        else
        {
          // Auto-connection failed
          response.success = false;
          if (resultObj.isMember("message"))
            response.message = resultObj["message"].asString();
            
          m_connectionStatus = ConnectionStatus::Disconnected;
          m_lastError = response.message;
          
          CLog::Log(LOGINFO, "WYLLOH: Failed to auto-connect wallet: %s", response.message.c_str());
        }
      }
      else
      {
        // Parse error
        response.success = false;
        response.message = "Invalid response format";
        m_connectionStatus = ConnectionStatus::Disconnected;
        m_lastError = "Invalid API response format";
        
        CLog::Log(LOGERROR, "WYLLOH: Failed to parse auto-connect response");
      }
    }
    else
    {
      // Empty response
      response.success = false;
      response.message = "No response from API";
      m_connectionStatus = ConnectionStatus::Disconnected;
      m_lastError = "No response from wallet API";
      
      CLog::Log(LOGERROR, "WYLLOH: No response from wallet API for auto-connect");
    }
  }
  catch (const std::exception& e)
  {
    // Exception occurred
    response.success = false;
    response.message = e.what();
    m_connectionStatus = ConnectionStatus::Disconnected;
    m_lastError = e.what();
    
    CLog::Log(LOGERROR, "WYLLOH: Exception in auto-connect: %s", e.what());
  }

  return response;
}

bool CWalletConnection::Disconnect()
{
  CSingleLock lock(m_criticalSection);

  // If already disconnected, return success
  if (m_connectionStatus == ConnectionStatus::Disconnected)
    return true;

  bool success = false;

  try
  {
    // Make request to wallet/disconnect endpoint
    std::string result = MakeApiRequest("wallet/disconnect", "POST");
    
    if (!result.empty())
    {
      CVariant resultObj;
      if (CJSONVariantParser::Parse(result, resultObj))
      {
        if (resultObj.isMember("success"))
          success = resultObj["success"].asBoolean();
            
        CLog::Log(LOGINFO, "WYLLOH: Wallet disconnection %s", 
                 success ? "successful" : "failed");
      }
      else
      {
        CLog::Log(LOGERROR, "WYLLOH: Failed to parse disconnect response");
      }
    }
    else
    {
      CLog::Log(LOGERROR, "WYLLOH: No response from wallet API for disconnect");
    }
  }
  catch (const std::exception& e)
  {
    CLog::Log(LOGERROR, "WYLLOH: Exception in disconnect: %s", e.what());
  }

  // Update state regardless of API response
  m_connectionStatus = ConnectionStatus::Disconnected;
  
  // We don't clear the address to allow for future auto-connect
  
  // Clear token data
  m_tokens.clear();
  
  return success;
}

CWalletConnection::ConnectionStatus CWalletConnection::GetConnectionStatus() const
{
  CSingleLock lock(m_criticalSection);
  return m_connectionStatus;
}

std::string CWalletConnection::GetAddress() const
{
  CSingleLock lock(m_criticalSection);
  return m_address;
}

void CWalletConnection::SetApiUrl(const std::string& url)
{
  CSingleLock lock(m_criticalSection);
  
  if (!url.empty())
  {
    m_apiUrl = url;
    
    // Ensure URL ends with /
    if (m_apiUrl.back() != '/')
      m_apiUrl += '/';
      
    CLog::Log(LOGINFO, "WYLLOH: Wallet API URL set to: %s", m_apiUrl.c_str());
  }
}

bool CWalletConnection::IsContentOwned(const std::string& contentId) const
{
  CSingleLock lock(m_criticalSection);
  
  // Not connected, can't own content
  if (m_connectionStatus != ConnectionStatus::Connected)
    return false;
    
  // Check if any token has the given content ID
  for (const auto& token : m_tokens)
  {
    if (token.contentId == contentId)
      return true;
  }
  
  return false;
}

std::vector<std::string> CWalletConnection::GetOwnedContentIds() const
{
  CSingleLock lock(m_criticalSection);
  
  std::vector<std::string> contentIds;
  
  // Not connected, return empty list
  if (m_connectionStatus != ConnectionStatus::Connected)
    return contentIds;
    
  // Extract content IDs from tokens
  for (const auto& token : m_tokens)
  {
    if (!token.contentId.empty())
      contentIds.push_back(token.contentId);
  }
  
  return contentIds;
}

std::vector<CWalletConnection::Token> CWalletConnection::GetOwnedTokens() const
{
  CSingleLock lock(m_criticalSection);
  return m_tokens;
}

bool CWalletConnection::RefreshTokenData()
{
  CSingleLock lock(m_criticalSection);
  
  // Not connected, can't refresh
  if (m_connectionStatus != ConnectionStatus::Connected)
    return false;
    
  bool success = false;
  m_tokens.clear();
  
  try
  {
    // Make request to wallet/tokens endpoint
    std::string result = MakeApiRequest("wallet/tokens", "GET");
    
    if (!result.empty())
    {
      CVariant resultObj;
      if (CJSONVariantParser::Parse(result, resultObj))
      {
        if (resultObj.isMember("success") && resultObj["success"].asBoolean() && 
            resultObj.isMember("tokens") && resultObj["tokens"].isArray())
        {
          // Parse tokens
          for (auto it = resultObj["tokens"].begin_array(); it != resultObj["tokens"].end_array(); ++it)
          {
            Token token;
            
            if ((*it).isMember("id"))
              token.id = (*it)["id"].asString();
              
            if ((*it).isMember("contentId"))
              token.contentId = (*it)["contentId"].asString();
              
            if ((*it).isMember("contentType"))
              token.contentType = (*it)["contentType"].asString();
              
            if ((*it).isMember("name"))
              token.name = (*it)["name"].asString();
              
            if ((*it).isMember("metadataUrl"))
              token.metadataUrl = (*it)["metadataUrl"].asString();
              
            if ((*it).isMember("attributes") && (*it)["attributes"].isObject())
            {
              // Parse attributes
              auto attrs = (*it)["attributes"];
              for (auto attrIt = attrs.begin_map(); attrIt != attrs.end_map(); ++attrIt)
              {
                token.attributes[attrIt.key()] = attrIt.value().asString();
              }
            }
            
            m_tokens.push_back(token);
          }
          
          success = true;
          CLog::Log(LOGINFO, "WYLLOH: Refreshed tokens, count: %zu", m_tokens.size());
        }
        else
        {
          CLog::Log(LOGERROR, "WYLLOH: Failed to refresh tokens, invalid response");
        }
      }
      else
      {
        CLog::Log(LOGERROR, "WYLLOH: Failed to parse token refresh response");
      }
    }
    else
    {
      CLog::Log(LOGERROR, "WYLLOH: No response from wallet API for token refresh");
    }
  }
  catch (const std::exception& e)
  {
    CLog::Log(LOGERROR, "WYLLOH: Exception in token refresh: %s", e.what());
  }
  
  return success;
}

std::string CWalletConnection::GetLastError() const
{
  CSingleLock lock(m_criticalSection);
  return m_lastError;
}

std::string CWalletConnection::MakeApiRequest(const std::string& endpoint, 
                                            const std::string& method,
                                            const std::string& data)
{
  std::string result;
  
  try
  {
    // Construct full URL
    std::string url = m_apiUrl;
    if (!endpoint.empty() && endpoint[0] != '/')
      url += endpoint;
    else
      url += endpoint.substr(1);
      
    // Create File object
    XFILE::CFile file;
    CURL curl(url);
    
    // Set headers
    curl.SetProtocolOption("Content-Type", "application/json");
    curl.SetProtocolOption("User-Agent", "Wylloh-Player/1.0");
    
    if (method == "POST" || method == "PUT")
    {
      if (data.empty())
      {
        // POST/PUT with empty body
        curl.SetProtocolOption("Content-Length", "0");
        
        // Open and read response
        if (file.Open(curl))
        {
          // Read response
          char buffer[1024];
          size_t bytesRead;
          while ((bytesRead = file.Read(buffer, sizeof(buffer) - 1)) > 0)
          {
            buffer[bytesRead] = '\0';
            result.append(buffer);
          }
          file.Close();
        }
        else
        {
          CLog::Log(LOGERROR, "WYLLOH: Failed to open URL: %s", url.c_str());
        }
      }
      else
      {
        // POST/PUT with data
        curl.SetProtocolOption("Content-Length", std::to_string(data.size()));
        
        // Open and write data
        if (file.OpenForWrite(curl, true))
        {
          // Write data
          file.Write(data.c_str(), data.size());
          
          // Read response
          std::string responseBuffer;
          if (file.GetHttpResponseHeader("Content-Type", responseBuffer) && 
              responseBuffer.find("application/json") != std::string::npos)
          {
            char buffer[1024];
            size_t bytesRead;
            while ((bytesRead = file.Read(buffer, sizeof(buffer) - 1)) > 0)
            {
              buffer[bytesRead] = '\0';
              result.append(buffer);
            }
          }
          file.Close();
        }
        else
        {
          CLog::Log(LOGERROR, "WYLLOH: Failed to open URL for write: %s", url.c_str());
        }
      }
    }
    else
    {
      // GET, DELETE, etc.
      if (file.Open(curl))
      {
        // Read response
        char buffer[1024];
        size_t bytesRead;
        while ((bytesRead = file.Read(buffer, sizeof(buffer) - 1)) > 0)
        {
          buffer[bytesRead] = '\0';
          result.append(buffer);
        }
        file.Close();
      }
      else
      {
        CLog::Log(LOGERROR, "WYLLOH: Failed to open URL: %s", url.c_str());
      }
    }
  }
  catch (const std::exception& e)
  {
    CLog::Log(LOGERROR, "WYLLOH: Exception in API request: %s", e.what());
  }
  
  return result;
}

void CWalletConnection::SaveWalletState()
{
  try
  {
    // Create state data
    CVariant stateData(CVariant::VariantTypeObject);
    stateData["address"] = m_address;
    stateData["connected"] = (m_connectionStatus == ConnectionStatus::Connected);
    
    // Add tokens
    CVariant tokensArray(CVariant::VariantTypeArray);
    for (const auto& token : m_tokens)
    {
      CVariant tokenObj(CVariant::VariantTypeObject);
      tokenObj["id"] = token.id;
      tokenObj["contentId"] = token.contentId;
      tokenObj["contentType"] = token.contentType;
      tokenObj["name"] = token.name;
      tokenObj["metadataUrl"] = token.metadataUrl;
      
      // Add attributes
      CVariant attrsObj(CVariant::VariantTypeObject);
      for (const auto& attr : token.attributes)
        attrsObj[attr.first] = attr.second;
        
      tokenObj["attributes"] = attrsObj;
      tokensArray.push_back(tokenObj);
    }
    stateData["tokens"] = tokensArray;
    
    // Serialize to JSON
    std::string jsonData = CJSONVariantWriter::Write(stateData, true);
    
    // Save to file
    std::string filePath = URIUtils::AddFileToFolder(m_walletDataPath, WALLET_STATE_FILE);
    XFILE::CFile file;
    if (file.OpenForWrite(filePath, true))
    {
      file.Write(jsonData.c_str(), jsonData.size());
      file.Close();
      
      CLog::Log(LOGDEBUG, "WYLLOH: Saved wallet state to %s", filePath.c_str());
    }
    else
    {
      CLog::Log(LOGERROR, "WYLLOH: Failed to save wallet state");
    }
  }
  catch (const std::exception& e)
  {
    CLog::Log(LOGERROR, "WYLLOH: Exception in save wallet state: %s", e.what());
  }
}

bool CWalletConnection::LoadWalletState()
{
  bool success = false;
  
  try
  {
    // Load from file
    std::string filePath = URIUtils::AddFileToFolder(m_walletDataPath, WALLET_STATE_FILE);
    XFILE::CFile file;
    if (file.Open(filePath))
    {
      // Read file content
      std::string jsonData;
      char buffer[1024];
      size_t bytesRead;
      while ((bytesRead = file.Read(buffer, sizeof(buffer) - 1)) > 0)
      {
        buffer[bytesRead] = '\0';
        jsonData.append(buffer);
      }
      file.Close();
      
      // Parse JSON
      CVariant stateData;
      if (CJSONVariantParser::Parse(jsonData, stateData))
      {
        // Load address
        if (stateData.isMember("address"))
          m_address = stateData["address"].asString();
          
        // Load connection status
        if (stateData.isMember("connected") && stateData["connected"].asBoolean())
          m_connectionStatus = ConnectionStatus::Connected;
        else
          m_connectionStatus = ConnectionStatus::Disconnected;
          
        // Load tokens
        m_tokens.clear();
        if (stateData.isMember("tokens") && stateData["tokens"].isArray())
        {
          for (auto it = stateData["tokens"].begin_array(); it != stateData["tokens"].end_array(); ++it)
          {
            Token token;
            
            if ((*it).isMember("id"))
              token.id = (*it)["id"].asString();
              
            if ((*it).isMember("contentId"))
              token.contentId = (*it)["contentId"].asString();
              
            if ((*it).isMember("contentType"))
              token.contentType = (*it)["contentType"].asString();
              
            if ((*it).isMember("name"))
              token.name = (*it)["name"].asString();
              
            if ((*it).isMember("metadataUrl"))
              token.metadataUrl = (*it)["metadataUrl"].asString();
              
            if ((*it).isMember("attributes") && (*it)["attributes"].isObject())
            {
              // Parse attributes
              auto attrs = (*it)["attributes"];
              for (auto attrIt = attrs.begin_map(); attrIt != attrs.end_map(); ++attrIt)
              {
                token.attributes[attrIt.key()] = attrIt.value().asString();
              }
            }
            
            m_tokens.push_back(token);
          }
        }
        
        success = true;
        CLog::Log(LOGINFO, "WYLLOH: Loaded wallet state, address: %s, tokens: %zu", 
                 m_address.c_str(), m_tokens.size());
      }
      else
      {
        CLog::Log(LOGERROR, "WYLLOH: Failed to parse wallet state JSON");
      }
    }
    else
    {
      CLog::Log(LOGINFO, "WYLLOH: No saved wallet state found");
    }
  }
  catch (const std::exception& e)
  {
    CLog::Log(LOGERROR, "WYLLOH: Exception in load wallet state: %s", e.what());
  }
  
  return success;
}

}  // namespace WALLET
}  // namespace WYLLOH 