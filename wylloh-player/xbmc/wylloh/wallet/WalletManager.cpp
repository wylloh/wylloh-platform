/*
 *  Copyright (C) 2023-2025 Wylloh Team
 *  This file is part of Wylloh Player - https://wylloh.com
 */

#include "wylloh/wallet/WalletManager.h"
#include "wylloh/wallet/WalletConnection.h"
#include "wylloh/wallet/WalletOverlay.h"
#include "utils/log.h"
#include "ServiceBroker.h"
#include "settings/Settings.h"
#include "Application.h"
#include "dialogs/GUIDialogOK.h"
#include "guilib/GUIComponent.h"
#include "guilib/GUIWindowManager.h"
#include "dialogs/GUIDialogYesNo.h"
#include "dialogs/GUIDialogProgress.h"
#include "messaging/helpers/DialogHelper.h"
#include "utils/StringUtils.h"
#include "guilib/LocalizeStrings.h"

namespace WYLLOH {
namespace WALLET {

CWalletManager::CWalletManager()
  : m_initialized(false),
    m_apiUrl("http://localhost:3333/api/")
{
  CLog::Log(LOGINFO, "WYLLOH: WalletManager created");
}

CWalletManager::~CWalletManager()
{
  Shutdown();
  CLog::Log(LOGINFO, "WYLLOH: WalletManager destroyed");
}

bool CWalletManager::Initialize()
{
  CSingleLock lock(m_criticalSection);

  if (m_initialized)
    return true;

  CLog::Log(LOGINFO, "WYLLOH: Initializing WalletManager");

  // Load settings
  auto settings = CServiceBroker::GetSettingsComponent()->GetSettings();
  if (settings)
  {
    m_apiUrl = settings->GetString("wylloh.api_url");
    if (m_apiUrl.empty())
    {
      m_apiUrl = "http://localhost:3333/api/";
      settings->SetString("wylloh.api_url", m_apiUrl);
    }
  }

  // Initialize wallet connection
  m_walletConnection = std::make_unique<CWalletConnection>();
  if (!m_walletConnection->Initialize(m_apiUrl))
  {
    CLog::Log(LOGERROR, "WYLLOH: Failed to initialize wallet connection");
    return false;
  }

  // Create wallet overlay
  m_walletOverlay = std::make_unique<CWalletOverlay>(m_walletConnection.get());
  if (!m_walletOverlay->Initialize())
  {
    CLog::Log(LOGERROR, "WYLLOH: Failed to initialize wallet overlay");
    // This is not critical, so we continue
  }

  // Auto-connect if enabled
  auto settings_component = CServiceBroker::GetSettingsComponent();
  if (settings_component && settings_component->GetSettings()->GetBool("wylloh.auto_connect"))
  {
    AutoConnectWallet();
  }

  // Show wallet overlay if enabled
  if (settings_component && settings_component->GetSettings()->GetBool("wylloh.show_overlay") && m_walletOverlay)
  {
    m_walletOverlay->SetVisible(true);
  }

  m_initialized = true;
  CLog::Log(LOGINFO, "WYLLOH: WalletManager initialized");
  return true;
}

void CWalletManager::Shutdown()
{
  CSingleLock lock(m_criticalSection);

  if (!m_initialized)
    return;

  CLog::Log(LOGINFO, "WYLLOH: Shutting down WalletManager");

  // Hide wallet overlay
  if (m_walletOverlay)
  {
    m_walletOverlay->SetVisible(false);
    m_walletOverlay.reset();
  }

  // Shutdown wallet connection
  if (m_walletConnection)
  {
    m_walletConnection->Shutdown();
    m_walletConnection.reset();
  }

  m_initialized = false;
}

bool CWalletManager::ConnectWalletWithQR()
{
  if (!m_initialized || !m_walletConnection)
    return false;

  // Check if already connected
  if (m_walletConnection->GetConnectionStatus() == CWalletConnection::ConnectionStatus::Connected)
    return true;

  CLog::Log(LOGINFO, "WYLLOH: Initiating QR wallet connection");

  // Initiate QR connection
  auto response = m_walletConnection->InitiateQRConnection();
  if (!response.success)
  {
    // Show error dialog
    MESSAGING::HELPERS::ShowOKDialogText(CVariant{30507}, // "Wallet"
                                         CVariant{StringUtils::Format(g_localizeStrings.Get(30519).c_str(), response.message.c_str())}); // "Connection failed: %s"
    return false;
  }

  // Show QR dialog
  if (m_walletOverlay)
  {
    m_walletOverlay->ShowQRDialog();
  }
  else
  {
    // TODO: Implement fallback QR dialog if wallet overlay is not available
    MESSAGING::HELPERS::ShowOKDialogText(CVariant{30507}, // "Wallet"
                                         CVariant{"QR connection not implemented yet"});
  }

  // Return true if connected after QR dialog
  return (m_walletConnection->GetConnectionStatus() == CWalletConnection::ConnectionStatus::Connected);
}

bool CWalletManager::AutoConnectWallet()
{
  if (!m_initialized || !m_walletConnection)
    return false;

  // Check if already connected
  if (m_walletConnection->GetConnectionStatus() == CWalletConnection::ConnectionStatus::Connected)
    return true;

  CLog::Log(LOGINFO, "WYLLOH: Attempting auto-connect wallet");

  // Attempt auto-connect
  auto response = m_walletConnection->AutoConnect();
  if (!response.success)
  {
    CLog::Log(LOGINFO, "WYLLOH: Auto-connect failed: %s", response.message.c_str());
    return false;
  }

  CLog::Log(LOGINFO, "WYLLOH: Auto-connected wallet: %s", response.address.c_str());
  return true;
}

bool CWalletManager::DisconnectWallet()
{
  if (!m_initialized || !m_walletConnection)
    return false;

  // Check if already disconnected
  if (m_walletConnection->GetConnectionStatus() != CWalletConnection::ConnectionStatus::Connected)
    return true;

  CLog::Log(LOGINFO, "WYLLOH: Disconnecting wallet");

  // Ask for confirmation
  bool confirmed = MESSAGING::HELPERS::ShowYesNoDialogText(CVariant{30507}, // "Wallet"
                                                         CVariant{"Are you sure you want to disconnect your wallet?"});
  if (!confirmed)
    return false;

  // Disconnect wallet
  bool success = m_walletConnection->Disconnect();
  if (!success)
  {
    CLog::Log(LOGERROR, "WYLLOH: Failed to disconnect wallet");
  }

  return success;
}

bool CWalletManager::IsConnected() const
{
  if (!m_initialized || !m_walletConnection)
    return false;

  return m_walletConnection->GetConnectionStatus() == CWalletConnection::ConnectionStatus::Connected;
}

std::string CWalletManager::GetWalletAddress() const
{
  if (!m_initialized || !m_walletConnection)
    return "";

  return m_walletConnection->GetAddress();
}

bool CWalletManager::VerifyContentOwnership(const std::string& contentId) const
{
  if (!m_initialized || !m_walletConnection)
    return false;

  return m_walletConnection->IsContentOwned(contentId);
}

std::vector<std::string> CWalletManager::GetOwnedContentIds() const
{
  if (!m_initialized || !m_walletConnection)
    return {};

  return m_walletConnection->GetOwnedContentIds();
}

void CWalletManager::SetApiUrl(const std::string& url)
{
  CSingleLock lock(m_criticalSection);

  m_apiUrl = url;

  // Update wallet connection
  if (m_walletConnection)
  {
    m_walletConnection->SetApiUrl(url);
  }
}

void CWalletManager::Process()
{
  // Nothing to process yet
  // This could be used to periodically check wallet status,
  // refresh token data, etc.
}

void CWalletManager::ShowWalletOverlay(bool show)
{
  if (!m_initialized || !m_walletOverlay)
    return;

  m_walletOverlay->SetVisible(show);

  // Update setting
  auto settings = CServiceBroker::GetSettingsComponent()->GetSettings();
  if (settings)
  {
    settings->SetBool("wylloh.show_overlay", show);
  }
}

}  // namespace WALLET
}  // namespace WYLLOH 