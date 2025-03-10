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

namespace WYLLOH {
namespace WALLET {

// Forward declarations
class CWalletQRDialog;

/**
 * Class to display wallet status overlay
 * Shows a semi-transparent overlay with wallet connection status
 */
class CWalletOverlay : public CGUIDialog, public CThread
{
public:
  CWalletOverlay(CWalletConnection* walletConnection);
  ~CWalletOverlay() override;

  /**
   * Initialize the overlay
   * 
   * @return True if initialization was successful
   */
  bool Initialize();

  /**
   * Start displaying the overlay
   */
  void Show();

  /**
   * Hide the overlay
   */
  void Hide();

  /**
   * Set visibility of the overlay
   * 
   * @param visible Whether the overlay should be visible
   */
  void SetVisible(bool visible);

  /**
   * Check if the overlay is visible
   * 
   * @return True if visible
   */
  bool IsVisible() const;

  /**
   * CThread implementation
   */
  void Process() override;

  /**
   * CGUIDialog implementations
   */
  bool OnMessage(CGUIMessage& message) override;
  bool OnAction(const CAction& action) override;
  void OnInitWindow() override;
  void OnDeinitWindow(int nextWindowID) override;
  void Render() override;

private:
  /**
   * Create the overlay UI components
   */
  void CreateControls();

  /**
   * Update the overlay with current wallet status
   */
  void UpdateOverlay();

  /**
   * Show wallet QR connection dialog
   */
  void ShowQRDialog();

  /**
   * Handle clicking the connect button
   */
  void OnConnectClick();

  /**
   * Calculate position for the overlay
   */
  void CalculatePosition();

  // Wallet connection
  CWalletConnection* m_walletConnection{nullptr};
  
  // UI Controls
  std::unique_ptr<CGUIImage> m_backgroundControl;
  std::unique_ptr<CGUIImage> m_iconControl;
  std::unique_ptr<CGUILabel> m_statusLabel;
  std::unique_ptr<CGUILabel> m_addressLabel;
  std::unique_ptr<CGUIButtonControl> m_connectButton;
  
  // QR Dialog
  std::unique_ptr<CWalletQRDialog> m_qrDialog;
  
  // State
  bool m_isVisible{false};
  bool m_isInitialized{false};
  std::string m_lastAddress;
  CWalletConnection::ConnectionStatus m_lastStatus{CWalletConnection::ConnectionStatus::Disconnected};
  
  // Thread synchronization
  CCriticalSection m_criticalSection;
  
  // Layout
  int m_width{300};
  int m_height{80};
  int m_xPosition{0};
  int m_yPosition{0};
};

}  // namespace WALLET
}  // namespace WYLLOH 