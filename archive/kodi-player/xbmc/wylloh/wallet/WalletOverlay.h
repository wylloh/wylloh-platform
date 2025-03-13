#pragma once
/*
 *  Copyright (C) 2023-2025 Wylloh Team
 *  This file is part of Wylloh Player - https://wylloh.com
 */

#include <string>
#include <memory>
#include "threads/Thread.h"
#include "threads/CriticalSection.h"
#include "guilib/GUIDialog.h"
#include "guilib/GUIImage.h"
#include "guilib/GUILabel.h"
#include "guilib/GUIButtonControl.h"
#include "wylloh/wallet/WalletConnection.h"
#include "utils/TimeUtils.h"
#include "guilib/GUITexture.h"
#include "guilib/GUILabelControl.h"

namespace WYLLOH {
namespace WALLET {

// Forward declarations
class CWalletQRDialog;

/**
 * @class CWalletOverlay
 * @brief UI overlay showing wallet connection status
 */
class CWalletOverlay
{
public:
  /**
   * Constructor
   * @param walletConnection Pointer to the wallet connection
   */
  CWalletOverlay(CWalletConnection* walletConnection);
  
  /**
   * Destructor
   */
  ~CWalletOverlay();

  /**
   * Initialize the overlay
   * @return True if successful, false otherwise
   */
  bool Initialize();
  
  /**
   * Clean up resources
   */
  void Deinitialize();
  
  /**
   * Set visibility of the overlay
   * @param visible Whether the overlay should be visible
   */
  void SetVisible(bool visible);
  
  /**
   * Check if the overlay is visible
   * @return True if visible, false otherwise
   */
  bool IsVisible() const;
  
  /**
   * Render the overlay
   */
  void Render();
  
  /**
   * Process overlay logic
   */
  void Process();
  
  /**
   * Show QR code connection dialog
   */
  void ShowQRDialog();
  
private:
  /**
   * Update overlay UI elements
   */
  void UpdateOverlay();

  // Wallet connection
  CWalletConnection* m_walletConnection;
  
  // State
  bool m_visible;
  bool m_qrDialogActive;
  unsigned int m_refreshTime;
  
  // UI Elements
  CGUITexture* m_textureStatus;
  CGUITexture* m_textureWallet;
  CGUILabelControl* m_labelAddress;
  CGUILabelControl* m_labelStatus;
};

}  // namespace WALLET
}  // namespace WYLLOH 