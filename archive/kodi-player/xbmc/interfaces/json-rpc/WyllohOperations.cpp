/*
 *  Copyright (C) 2023-2025 Wylloh Team
 *  This file is part of Wylloh Player - https://wylloh.com
 */

#include "WyllohOperations.h"
#include "Application.h"
#include "ServiceBroker.h"
#include "interfaces/json-rpc/JSONServiceDescription.h"
#include "wylloh/WyllohManager.h"
#include "wylloh/wallet/WalletManager.h"
#include "utils/log.h"

using namespace JSONRPC;

JSONRPC_STATUS CWyllohOperations::GetWalletStatus(const std::string &method, ITransportLayer *transport, IClient *client, const CVariant &parameterObject, CVariant &result)
{
  auto app = CServiceBroker::GetAppComponents().GetComponent<CApplicationPlayer>();
  if (!app)
    return InvalidParams;

  auto& application = g_application;
  if (!application.m_wyllohManager)
    return InvalidParams;

  // Get WalletManager from WyllohManager (if properly implemented)
  auto walletManager = application.m_wyllohManager->GetWalletManager();
  if (!walletManager)
    return InvalidParams;

  // Populate result with wallet status
  bool isConnected = walletManager->IsConnected();
  result["connected"] = isConnected;
  
  if (isConnected)
  {
    result["address"] = walletManager->GetWalletAddress();
  }
  else
  {
    result["address"] = "";
  }

  return OK;
}

JSONRPC_STATUS CWyllohOperations::ConnectWallet(const std::string &method, ITransportLayer *transport, IClient *client, const CVariant &parameterObject, CVariant &result)
{
  auto app = CServiceBroker::GetAppComponents().GetComponent<CApplicationPlayer>();
  if (!app)
    return InvalidParams;

  auto& application = g_application;
  if (!application.m_wyllohManager)
    return InvalidParams;

  // Get WalletManager from WyllohManager (if properly implemented)
  auto walletManager = application.m_wyllohManager->GetWalletManager();
  if (!walletManager)
    return InvalidParams;

  // Initiate wallet connection
  bool success = walletManager->ConnectWalletWithQR();
  result["success"] = success;

  if (success)
  {
    result["connected"] = true;
    result["address"] = walletManager->GetWalletAddress();
  }
  else
  {
    result["connected"] = false;
    result["address"] = "";
    result["message"] = "Failed to connect wallet";
  }

  return OK;
}

JSONRPC_STATUS CWyllohOperations::DisconnectWallet(const std::string &method, ITransportLayer *transport, IClient *client, const CVariant &parameterObject, CVariant &result)
{
  auto app = CServiceBroker::GetAppComponents().GetComponent<CApplicationPlayer>();
  if (!app)
    return InvalidParams;

  auto& application = g_application;
  if (!application.m_wyllohManager)
    return InvalidParams;

  // Get WalletManager from WyllohManager (if properly implemented)
  auto walletManager = application.m_wyllohManager->GetWalletManager();
  if (!walletManager)
    return InvalidParams;

  // Disconnect wallet
  bool success = walletManager->DisconnectWallet();
  result["success"] = success;

  return OK;
}

JSONRPC_STATUS CWyllohOperations::VerifyContent(const std::string &method, ITransportLayer *transport, IClient *client, const CVariant &parameterObject, CVariant &result)
{
  auto app = CServiceBroker::GetAppComponents().GetComponent<CApplicationPlayer>();
  if (!app)
    return InvalidParams;

  auto& application = g_application;
  if (!application.m_wyllohManager)
    return InvalidParams;

  // Check parameter
  if (!parameterObject.isMember("contentid") || !parameterObject["contentid"].isString())
    return InvalidParams;

  std::string contentId = parameterObject["contentid"].asString();
  
  // Verify content ownership
  bool isPlayable = application.m_wyllohManager->IsContentPlayable(contentId);
  result["playable"] = isPlayable;
  
  // Get the detailed ownership information
  bool isOwned = application.m_wyllohManager->VerifyContentOwnership(contentId);
  result["owned"] = isOwned;

  return OK;
}

JSONRPC_STATUS CWyllohOperations::GetOwnedContent(const std::string &method, ITransportLayer *transport, IClient *client, const CVariant &parameterObject, CVariant &result)
{
  auto app = CServiceBroker::GetAppComponents().GetComponent<CApplicationPlayer>();
  if (!app)
    return InvalidParams;

  auto& application = g_application;
  if (!application.m_wyllohManager)
    return InvalidParams;

  // Get owned content IDs
  auto contentIds = application.m_wyllohManager->GetOwnedContentIds();
  
  // Convert to CVariant array
  CVariant contentArray(CVariant::VariantTypeArray);
  for (const auto& id : contentIds)
  {
    contentArray.push_back(id);
  }
  
  result["items"] = contentArray;
  result["count"] = static_cast<int>(contentIds.size());

  return OK;
} 