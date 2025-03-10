/*
 *  Copyright (C) 2023-2025 Wylloh Team
 *  This file is part of Wylloh Player - https://wylloh.com
 */

#include "wylloh/WyllohManager.h"
#include "wylloh/wallet/WalletManager.h"
#include "wylloh/wallet/ContentVerificationCache.h"
#include "utils/log.h"
#include "ServiceBroker.h"
#include "settings/Settings.h"
#include "settings/SettingsComponent.h"
#include "settings/lib/ISettingCallback.h"
#include "Application.h"
#include "dialogs/GUIDialogOK.h"
#include "messaging/helpers/DialogHelper.h"
#include "utils/StringUtils.h"
#include "guilib/LocalizeStrings.h"
#include "filesystem/File.h"
#include "filesystem/Directory.h"

namespace WYLLOH {

CWyllohManager::CWyllohManager()
  : m_initialized(false),
    m_processingToken(false),
    m_lastProcessTime(0)
{
  CLog::Log(LOGINFO, "WYLLOH: WyllohManager created");
}

CWyllohManager::~CWyllohManager()
{
  Shutdown();
  CLog::Log(LOGINFO, "WYLLOH: WyllohManager destroyed");
}

bool CWyllohManager::Initialize()
{
  CSingleLock lock(m_criticalSection);

  if (m_initialized)
    return true;

  CLog::Log(LOGINFO, "WYLLOH: Initializing WyllohManager");

  // Create necessary directories
  if (!CreateDirectories())
  {
    CLog::Log(LOGERROR, "WYLLOH: Failed to create necessary directories");
    return false;
  }

  // Register as settings callback
  CServiceBroker::GetSettingsComponent()->GetSettings()->RegisterCallback(this, "wylloh");

  // Initialize content verification cache
  if (!WYLLOH::WALLET::CContentVerificationCache::GetInstance().Initialize())
  {
    CLog::Log(LOGERROR, "WYLLOH: Failed to initialize content verification cache");
    // Non-critical, continue with initialization
  }

  // Initialize wallet manager
  m_walletManager = std::make_unique<WALLET::CWalletManager>();
  if (!m_walletManager->Initialize())
  {
    CLog::Log(LOGERROR, "WYLLOH: Failed to initialize wallet manager");
    return false;
  }

  m_initialized = true;
  m_lastProcessTime = CTimeUtils::GetFrameTime();
  CLog::Log(LOGINFO, "WYLLOH: WyllohManager initialized");
  return true;
}

void CWyllohManager::Shutdown()
{
  CSingleLock lock(m_criticalSection);

  if (!m_initialized)
    return;

  CLog::Log(LOGINFO, "WYLLOH: Shutting down WyllohManager");

  // Unregister from settings callback
  CServiceBroker::GetSettingsComponent()->GetSettings()->UnregisterCallback(this);

  // Shutdown wallet manager
  if (m_walletManager)
  {
    m_walletManager->Shutdown();
    m_walletManager.reset();
  }

  // Shutdown content verification cache
  WYLLOH::WALLET::CContentVerificationCache::GetInstance().Shutdown();

  m_initialized = false;
}

void CWyllohManager::OnSettingChanged(const std::shared_ptr<const CSetting>& setting)
{
  if (!setting)
    return;

  const std::string& settingId = setting->GetId();

  if (settingId == "wylloh.api_url")
  {
    // Update wallet manager API URL
    if (m_walletManager)
    {
      auto apiUrl = std::static_pointer_cast<const CSettingString>(setting)->GetValue();
      m_walletManager->SetApiUrl(apiUrl);
    }
  }
  else if (settingId == "wylloh.show_overlay")
  {
    // Update wallet overlay visibility
    if (m_walletManager)
    {
      bool showOverlay = std::static_pointer_cast<const CSettingBool>(setting)->GetValue();
      m_walletManager->ShowWalletOverlay(showOverlay);
    }
  }
}

void CWyllohManager::OnSettingAction(const std::shared_ptr<const CSetting>& setting)
{
  if (!setting)
    return;

  const std::string& settingId = setting->GetId();

  if (settingId == "wylloh.connect_wallet")
  {
    // Connect wallet
    if (m_walletManager)
    {
      m_walletManager->ConnectWalletWithQR();
    }
  }
  else if (settingId == "wylloh.disconnect_wallet")
  {
    // Disconnect wallet
    if (m_walletManager)
    {
      m_walletManager->DisconnectWallet();
    }
  }
}

void CWyllohManager::Process()
{
  if (!m_initialized)
    return;

  // Only process every 100ms
  unsigned int currentTime = CTimeUtils::GetFrameTime();
  if (currentTime - m_lastProcessTime < 100)
    return;

  m_lastProcessTime = currentTime;

  // Process wallet manager
  if (m_walletManager)
  {
    m_walletManager->Process();
  }
}

bool CWyllohManager::IsContentPlayable(const std::string& contentId)
{
  if (!m_initialized || !m_walletManager)
    return true; // If not initialized, allow playback by default

  // Check if this is a token-gated content
  if (!IsTokenGatedContent(contentId))
    return true; // If not token-gated, allow playback

  // Check if wallet is connected
  if (!m_walletManager->IsConnected())
  {
    // Wallet not connected, show prompt to connect
    bool confirmed = MESSAGING::HELPERS::ShowYesNoDialogText(
      CVariant{30507}, // "Wallet"
      CVariant{StringUtils::Format(g_localizeStrings.Get(30521).c_str(), contentId.c_str())}, // "This content requires wallet verification. Connect your wallet to play %s?"
      CVariant{30522}, // "Connect"
      CVariant{30523}  // "Cancel"
    );

    if (confirmed)
    {
      // Try to connect wallet
      if (m_walletManager->ConnectWalletWithQR())
      {
        // Wallet connected, check ownership
        return VerifyContentOwnership(contentId);
      }
      
      // Connection failed
      return false;
    }
    
    // User canceled connection
    return false;
  }

  // Wallet is connected, verify content ownership
  return VerifyContentOwnership(contentId);
}

bool CWyllohManager::VerifyContentOwnership(const std::string& contentId)
{
  if (!m_initialized || !m_walletManager)
    return false;

  // Avoid re-entrancy
  if (m_processingToken)
    return false;

  m_processingToken = true;

  // Show verification dialog
  MESSAGING::HELPERS::ShowBusyDialogText(
    CVariant{30507}, // "Wallet"
    CVariant{30524}  // "Verifying content ownership..."
  );

  // Verify content ownership
  bool isOwned = m_walletManager->VerifyContentOwnership(contentId);

  // Hide verification dialog
  MESSAGING::HELPERS::HideBusyDialog();

  // Show result dialog if not owned
  if (!isOwned)
  {
    MESSAGING::HELPERS::ShowOKDialogText(
      CVariant{30507}, // "Wallet"
      CVariant{StringUtils::Format(g_localizeStrings.Get(30525).c_str(), contentId.c_str())} // "You don't own the token required to play %s."
    );
  }

  m_processingToken = false;
  return isOwned;
}

std::vector<std::string> CWyllohManager::GetOwnedContentIds()
{
  if (!m_initialized || !m_walletManager)
    return {};

  return m_walletManager->GetOwnedContentIds();
}

bool CWyllohManager::IsTokenGatedContent(const std::string& contentId)
{
  // For now, let's assume all content is token-gated
  // In a real implementation, this would check for token requirements
  // using a content metadata lookup service
  return true;
}

bool CWyllohManager::CreateDirectories()
{
  // Create Wylloh base directory
  std::string basePath = CServiceBroker::GetAppParams()->GetAppPath() + "wylloh-config";
  if (!XFILE::CDirectory::Exists(basePath) && !XFILE::CDirectory::Create(basePath))
  {
    CLog::Log(LOGERROR, "WYLLOH: Failed to create base directory: %s", basePath.c_str());
    return false;
  }

  // Create wallet directory
  std::string walletPath = basePath + "/wallet";
  if (!XFILE::CDirectory::Exists(walletPath) && !XFILE::CDirectory::Create(walletPath))
  {
    CLog::Log(LOGERROR, "WYLLOH: Failed to create wallet directory: %s", walletPath.c_str());
    return false;
  }

  // Create media directory
  std::string mediaPath = basePath + "/media";
  if (!XFILE::CDirectory::Exists(mediaPath) && !XFILE::CDirectory::Create(mediaPath))
  {
    CLog::Log(LOGERROR, "WYLLOH: Failed to create media directory: %s", mediaPath.c_str());
    return false;
  }

  return true;
}

}  // namespace WYLLOH 