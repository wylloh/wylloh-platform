/*
 *  Copyright (C) 2023-2025 Wylloh Team
 *  This file is part of Wylloh Player - https://wylloh.com
 */

#include "wylloh/wallet/WalletQRDialog.h"
#include "wylloh/wallet/WalletConnection.h"
#include "guilib/GUIComponent.h"
#include "guilib/GUIWindowManager.h"
#include "guilib/LocalizeStrings.h"
#include "guilib/GUIImage.h"
#include "guilib/GUIMessage.h"
#include "guilib/GUIWindowManager.h"
#include "ServiceBroker.h"
#include "utils/log.h"
#include "TextureCache.h"
#include "URL.h"
#include "filesystem/File.h"
#include "filesystem/CurlFile.h"

namespace WYLLOH {
namespace WALLET {

// Controls IDs
#define QR_DIALOG_HEADING        1
#define QR_DIALOG_IMAGE          2
#define QR_DIALOG_STATUS_LABEL   3
#define QR_DIALOG_CANCEL_BUTTON  10

// Status check interval in milliseconds
#define STATUS_CHECK_INTERVAL    2000

CGUIDialogWalletQR::CGUIDialogWalletQR()
  : CGUIDialogBoxBase(1260, "DialogWalletQR.xml"), // Using a unique dialog ID
    m_walletConnection(nullptr),
    m_statusTimer(this),
    m_qrImage(nullptr),
    m_statusLabel(nullptr),
    m_checkCount(0),
    m_connectionComplete(false)
{
  m_loadType = LOAD_ON_GUI_INIT;
}

CGUIDialogWalletQR::~CGUIDialogWalletQR()
{
  m_statusTimer.Stop();
}

bool CGUIDialogWalletQR::OnMessage(CGUIMessage& message)
{
  if (message.GetMessage() == GUI_MSG_CLICKED)
  {
    int controlId = message.GetSenderId();
    if (controlId == QR_DIALOG_CANCEL_BUTTON)
    {
      Close();
      return true;
    }
  }
  
  return CGUIDialogBoxBase::OnMessage(message);
}

bool CGUIDialogWalletQR::OnAction(const CAction& action)
{
  if (action.GetID() == ACTION_PREVIOUS_MENU || action.GetID() == ACTION_NAV_BACK)
  {
    Close();
    return true;
  }
  
  return CGUIDialogBoxBase::OnAction(action);
}

void CGUIDialogWalletQR::Open(CWalletConnection* walletConnection)
{
  if (!walletConnection)
  {
    CLog::Log(LOGERROR, "WYLLOH: Cannot open QR dialog without wallet connection");
    return;
  }
  
  m_walletConnection = walletConnection;
  m_checkCount = 0;
  m_connectionComplete = false;
  
  // Get QR code data
  auto qrResult = m_walletConnection->GetQRConnectionData();
  if (!qrResult.success || qrResult.qrImageUrl.empty())
  {
    CLog::Log(LOGERROR, "WYLLOH: Failed to get QR connection data");
    return;
  }
  
  m_qrImageUrl = qrResult.qrImageUrl;
  
  // Open the dialog
  CServiceBroker::GetGUI()->GetWindowManager().ActivateWindow(GetID());
}

void CGUIDialogWalletQR::Close(bool forceClose /*= false*/)
{
  m_statusTimer.Stop();
  m_walletConnection = nullptr;
  
  CGUIDialogBoxBase::Close(forceClose);
}

void CGUIDialogWalletQR::OnInitWindow()
{
  // Initialize controls
  m_qrImage = static_cast<CGUIImage*>(GetControl(QR_DIALOG_IMAGE));
  m_statusLabel = static_cast<CGUILabelControl*>(GetControl(QR_DIALOG_STATUS_LABEL));
  
  if (m_qrImage && !m_qrImageUrl.empty())
  {
    SetQRImage(m_qrImageUrl);
  }
  
  if (m_statusLabel)
  {
    m_statusLabel->SetLabel(g_localizeStrings.Get(30526)); // "Waiting for wallet connection..."
  }
  
  // Set dialog heading
  SetHeading(CVariant{30527}); // "Connect Wallet"
  
  // Start status check timer
  m_statusTimer.Start(STATUS_CHECK_INTERVAL);
  
  CGUIDialogBoxBase::OnInitWindow();
}

void CGUIDialogWalletQR::OnDeinitWindow(int nextWindowID)
{
  m_statusTimer.Stop();
  
  CGUIDialogBoxBase::OnDeinitWindow(nextWindowID);
}

void CGUIDialogWalletQR::OnTimer()
{
  if (!m_walletConnection)
    return;
  
  UpdateStatus();
  
  // Restart timer if we're still waiting for connection
  if (!m_connectionComplete)
  {
    m_statusTimer.Start(STATUS_CHECK_INTERVAL);
  }
}

void CGUIDialogWalletQR::SetQRImage(const std::string& url)
{
  if (!m_qrImage)
    return;
  
  // Check if the URL is for a local file or a remote file
  if (CURL::IsFileOnly(url) || CURL::IsLocalHost(url))
  {
    // Local file
    m_qrImage->SetFileName(url);
  }
  else
  {
    // Remote file
    m_qrImage->SetFileName("special://temp/wylloh_qr_code.png");
    
    // Download the image
    XFILE::CCurlFile curlFile;
    if (!curlFile.Download(url, "special://temp/wylloh_qr_code.png"))
    {
      CLog::Log(LOGERROR, "WYLLOH: Failed to download QR image from %s", url.c_str());
      return;
    }
  }
}

void CGUIDialogWalletQR::UpdateStatus()
{
  if (!m_walletConnection || !m_statusLabel)
    return;
  
  // Check connection status
  auto result = m_walletConnection->CheckQRConnectionStatus();
  
  // Update status label based on status
  if (result.status == QRConnectionStatus::Pending)
  {
    // Still waiting for connection
    m_checkCount++;
    
    // Update status message with count
    m_statusLabel->SetLabel(g_localizeStrings.Get(30526) + "  " + 
                            std::string(m_checkCount % 4, '.'));
  }
  else if (result.status == QRConnectionStatus::Connected)
  {
    // Connection successful
    m_statusLabel->SetLabel(g_localizeStrings.Get(30528)); // "Connection successful! Completing..."
    
    // Complete the connection
    auto completeResult = m_walletConnection->CompleteQRConnection();
    if (completeResult.success)
    {
      m_statusLabel->SetLabel(g_localizeStrings.Get(30518)); // "Connection successful!"
    }
    else
    {
      m_statusLabel->SetLabel(StringUtils::Format(g_localizeStrings.Get(30519).c_str(),
                                                 completeResult.message.c_str())); // "Connection failed: %s"
    }
    
    m_connectionComplete = true;
    
    // Close dialog after a short delay
    CGUIDialogBoxBase::SetAutoClose(3000);
  }
  else if (result.status == QRConnectionStatus::Failed)
  {
    // Connection failed
    m_statusLabel->SetLabel(StringUtils::Format(g_localizeStrings.Get(30519).c_str(),
                                               result.message.c_str())); // "Connection failed: %s"
    
    m_connectionComplete = true;
    
    // Close dialog after a short delay
    CGUIDialogBoxBase::SetAutoClose(3000);
  }
  else if (result.status == QRConnectionStatus::Expired)
  {
    // QR code expired
    m_statusLabel->SetLabel(g_localizeStrings.Get(30520)); // "QR code expired. Please try again."
    
    m_connectionComplete = true;
    
    // Close dialog after a short delay
    CGUIDialogBoxBase::SetAutoClose(3000);
  }
}

}  // namespace WALLET
}  // namespace WYLLOH 