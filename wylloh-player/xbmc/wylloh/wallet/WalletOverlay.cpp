/*
 *  Copyright (C) 2023-2025 Wylloh Team
 *  This file is part of Wylloh Player - https://wylloh.com
 */

#include "wylloh/wallet/WalletOverlay.h"
#include "wylloh/wallet/WalletConnection.h"
#include "utils/log.h"
#include "ServiceBroker.h"
#include "Application.h"
#include "guilib/GUIComponent.h"
#include "guilib/GUIWindowManager.h"
#include "dialogs/GUIDialogBusy.h"
#include "dialogs/GUIDialogOK.h"
#include "messaging/helpers/DialogHelper.h"
#include "utils/StringUtils.h"
#include "utils/Variant.h"
#include "guilib/LocalizeStrings.h"
#include "guilib/GUITexture.h"
#include "guilib/GUILabelControl.h"
#include "addons/AddonManager.h"
#include "rendering/RenderSystem.h"
#include "Texture.h"
#include "system/System.h"

namespace WYLLOH {
namespace WALLET {

CWalletOverlay::CWalletOverlay(CWalletConnection* walletConnection)
  : m_walletConnection(walletConnection),
    m_visible(false),
    m_qrDialogActive(false),
    m_refreshTime(0),
    m_textureStatus(nullptr),
    m_textureWallet(nullptr),
    m_labelAddress(nullptr),
    m_labelStatus(nullptr)
{
  CLog::Log(LOGINFO, "WYLLOH: WalletOverlay created");
}

CWalletOverlay::~CWalletOverlay()
{
  Deinitialize();
  CLog::Log(LOGINFO, "WYLLOH: WalletOverlay destroyed");
}

bool CWalletOverlay::Initialize()
{
  if (!m_walletConnection)
  {
    CLog::Log(LOGERROR, "WYLLOH: Cannot initialize wallet overlay without wallet connection");
    return false;
  }

  m_refreshTime = CTimeUtils::GetFrameTime();

  // Create texture for wallet status icon
  m_textureStatus = new CGUITexture(0, 0, 0, 0, 32, 32);
  if (!m_textureStatus)
  {
    CLog::Log(LOGERROR, "WYLLOH: Failed to create status texture");
    return false;
  }

  // Create texture for wallet icon
  m_textureWallet = new CGUITexture(0, 0, 0, 0, 32, 32);
  if (!m_textureWallet)
  {
    CLog::Log(LOGERROR, "WYLLOH: Failed to create wallet texture");
    delete m_textureStatus;
    m_textureStatus = nullptr;
    return false;
  }

  // Create address label
  m_labelAddress = new CGUILabelControl(0, 0, 0, 0, 200, 20, "", 0xFFFFFFFF, 0, XBFONT_RIGHT);
  if (!m_labelAddress)
  {
    CLog::Log(LOGERROR, "WYLLOH: Failed to create address label");
    delete m_textureStatus;
    delete m_textureWallet;
    m_textureStatus = nullptr;
    m_textureWallet = nullptr;
    return false;
  }

  // Create status label
  m_labelStatus = new CGUILabelControl(0, 0, 0, 0, 200, 20, "", 0xFFFFFFFF, 0, XBFONT_RIGHT);
  if (!m_labelStatus)
  {
    CLog::Log(LOGERROR, "WYLLOH: Failed to create status label");
    delete m_textureStatus;
    delete m_textureWallet;
    delete m_labelAddress;
    m_textureStatus = nullptr;
    m_textureWallet = nullptr;
    m_labelAddress = nullptr;
    return false;
  }

  // Set initial textures and labels
  UpdateOverlay();

  CLog::Log(LOGINFO, "WYLLOH: WalletOverlay initialized");
  return true;
}

void CWalletOverlay::Deinitialize()
{
  // Clean up textures and labels
  delete m_textureStatus;
  delete m_textureWallet;
  delete m_labelAddress;
  delete m_labelStatus;
  
  m_textureStatus = nullptr;
  m_textureWallet = nullptr;
  m_labelAddress = nullptr;
  m_labelStatus = nullptr;
}

void CWalletOverlay::SetVisible(bool visible)
{
  m_visible = visible;
}

bool CWalletOverlay::IsVisible() const
{
  return m_visible;
}

void CWalletOverlay::Render()
{
  if (!m_visible || !m_walletConnection)
    return;

  // Check if we need to update the overlay information
  unsigned int currentTime = CTimeUtils::GetFrameTime();
  if (currentTime - m_refreshTime > 1000) // Update every second
  {
    UpdateOverlay();
    m_refreshTime = currentTime;
  }

  // Get rendering system and window dimensions
  CRenderSystemBase* renderSystem = CServiceBroker::GetRenderSystem();
  if (!renderSystem)
    return;

  int screenWidth = renderSystem->GetWidth();
  int screenHeight = renderSystem->GetHeight();

  // Calculate positions for overlay elements (top right corner)
  int topMargin = 20;
  int rightMargin = 20;
  int iconSize = 32;
  int spacing = 10;

  // Render wallet icon
  if (m_textureWallet)
  {
    m_textureWallet->SetPosition(screenWidth - rightMargin - iconSize, topMargin);
    m_textureWallet->SetWidth(iconSize);
    m_textureWallet->SetHeight(iconSize);
    m_textureWallet->Render();
  }

  // Render wallet address label
  if (m_labelAddress)
  {
    m_labelAddress->SetPosition(screenWidth - rightMargin - iconSize - spacing - 200, topMargin);
    m_labelAddress->Render();
  }

  // Render status icon
  if (m_textureStatus)
  {
    m_textureStatus->SetPosition(screenWidth - rightMargin - iconSize, topMargin + iconSize + spacing);
    m_textureStatus->SetWidth(iconSize);
    m_textureStatus->SetHeight(iconSize);
    m_textureStatus->Render();
  }

  // Render status label
  if (m_labelStatus)
  {
    m_labelStatus->SetPosition(screenWidth - rightMargin - iconSize - spacing - 200, topMargin + iconSize + spacing);
    m_labelStatus->Render();
  }
}

void CWalletOverlay::Process()
{
  // If QR dialog is active, check connection status
  if (m_qrDialogActive && m_walletConnection)
  {
    auto result = m_walletConnection->CheckQRConnectionStatus();
    if (result.status != QRConnectionStatus::Pending)
    {
      // Connection attempt finished
      m_qrDialogActive = false;
      
      // Show result to user
      if (result.status == QRConnectionStatus::Connected)
      {
        // Complete connection
        auto completeResult = m_walletConnection->CompleteQRConnection();
        if (completeResult.success)
        {
          // Connection successful
          MESSAGING::HELPERS::ShowOKDialogText(CVariant{30507}, // "Wallet"
                                               CVariant{30518}); // "Connection successful!"
        }
        else
        {
          // Connection failed
          MESSAGING::HELPERS::ShowOKDialogText(CVariant{30507}, // "Wallet"
                                               CVariant{StringUtils::Format(g_localizeStrings.Get(30519).c_str(), completeResult.message.c_str())}); // "Connection failed: %s"
        }
      }
      else if (result.status == QRConnectionStatus::Failed)
      {
        // Connection failed
        MESSAGING::HELPERS::ShowOKDialogText(CVariant{30507}, // "Wallet"
                                             CVariant{StringUtils::Format(g_localizeStrings.Get(30519).c_str(), result.message.c_str())}); // "Connection failed: %s"
      }
      else if (result.status == QRConnectionStatus::Expired)
      {
        // QR code expired
        MESSAGING::HELPERS::ShowOKDialogText(CVariant{30507}, // "Wallet"
                                             CVariant{30520}); // "QR code expired. Please try again."
      }
      
      // Update overlay after connection attempt
      UpdateOverlay();
    }
  }
}

void CWalletOverlay::ShowQRDialog()
{
  if (!m_walletConnection)
    return;

  auto qrResult = m_walletConnection->GetQRConnectionData();
  if (!qrResult.success || qrResult.qrImageUrl.empty())
  {
    CLog::Log(LOGERROR, "WYLLOH: Failed to get QR connection data");
    return;
  }

  // Set QR dialog active flag
  m_qrDialogActive = true;

  // TODO: Implement QR dialog
  // For now, we'll just show a message saying QR connection is not implemented
  MESSAGING::HELPERS::ShowOKDialogText(CVariant{30507}, // "Wallet"
                                       CVariant{"Scan the QR code with your wallet app to connect.\n\nNote: This is a placeholder. In a real implementation, this would show the QR code image."});
}

void CWalletOverlay::UpdateOverlay()
{
  if (!m_walletConnection)
    return;

  // Update status icon and label based on connection status
  auto status = m_walletConnection->GetConnectionStatus();
  if (status == CWalletConnection::ConnectionStatus::Connected)
  {
    // Set connected icon
    if (m_textureStatus)
    {
      m_textureStatus->SetFileName("special://skin/media/wylloh/status_connected.png");
    }
    
    // Set status label
    if (m_labelStatus)
    {
      m_labelStatus->SetLabel("Connected");
    }

    // Set wallet address
    if (m_labelAddress)
    {
      std::string address = m_walletConnection->GetAddress();
      if (!address.empty() && address.length() > 10)
      {
        // Truncate address for display
        std::string truncated = address.substr(0, 6) + "..." + address.substr(address.length() - 4);
        m_labelAddress->SetLabel(truncated);
      }
      else
      {
        m_labelAddress->SetLabel(address);
      }
    }
  }
  else if (status == CWalletConnection::ConnectionStatus::Connecting)
  {
    // Set connecting icon
    if (m_textureStatus)
    {
      m_textureStatus->SetFileName("special://skin/media/wylloh/status_connecting.png");
    }
    
    // Set status label
    if (m_labelStatus)
    {
      m_labelStatus->SetLabel("Connecting...");
    }

    // Clear wallet address
    if (m_labelAddress)
    {
      m_labelAddress->SetLabel("");
    }
  }
  else
  {
    // Set disconnected icon
    if (m_textureStatus)
    {
      m_textureStatus->SetFileName("special://skin/media/wylloh/status_disconnected.png");
    }
    
    // Set status label
    if (m_labelStatus)
    {
      m_labelStatus->SetLabel("Disconnected");
    }

    // Clear wallet address
    if (m_labelAddress)
    {
      m_labelAddress->SetLabel("");
    }
  }

  // Update wallet icon
  if (m_textureWallet)
  {
    m_textureWallet->SetFileName("special://skin/media/wylloh/wallet_icon.png");
  }
}

}  // namespace WALLET
}  // namespace WYLLOH 