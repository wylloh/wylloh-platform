#include "WyllohOperations.h"

const CJSONServiceDescription::MethodCall JSONRPC_SERVICE_METHODS[] =
{
  // ... existing code ...

  // Wylloh operations
  { "Wylloh.GetWalletStatus",      CWyllohOperations::GetWalletStatus,     OPERATION_PERMISSION_READ },
  { "Wylloh.ConnectWallet",        CWyllohOperations::ConnectWallet,       OPERATION_PERMISSION_CONTROL },
  { "Wylloh.DisconnectWallet",     CWyllohOperations::DisconnectWallet,    OPERATION_PERMISSION_CONTROL },
  { "Wylloh.VerifyContent",        CWyllohOperations::VerifyContent,       OPERATION_PERMISSION_READ },
  { "Wylloh.GetOwnedContent",      CWyllohOperations::GetOwnedContent,     OPERATION_PERMISSION_READ },

  // ... existing code ...
}; 