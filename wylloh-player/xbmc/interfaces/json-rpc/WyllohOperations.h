/*
 *  Copyright (C) 2023-2025 Wylloh Team
 *  This file is part of Wylloh Player - https://wylloh.com
 */

#pragma once

#include "interfaces/json-rpc/JSONUtils.h"
#include "JSONRPC.h"

class CVariant;

namespace JSONRPC
{
  class CWyllohOperations
  {
  public:
    static JSONRPC_STATUS GetWalletStatus(const std::string &method, ITransportLayer *transport, IClient *client, const CVariant &parameterObject, CVariant &result);
    static JSONRPC_STATUS ConnectWallet(const std::string &method, ITransportLayer *transport, IClient *client, const CVariant &parameterObject, CVariant &result);
    static JSONRPC_STATUS DisconnectWallet(const std::string &method, ITransportLayer *transport, IClient *client, const CVariant &parameterObject, CVariant &result);
    static JSONRPC_STATUS VerifyContent(const std::string &method, ITransportLayer *transport, IClient *client, const CVariant &parameterObject, CVariant &result);
    static JSONRPC_STATUS GetOwnedContent(const std::string &method, ITransportLayer *transport, IClient *client, const CVariant &parameterObject, CVariant &result);
  };
} 