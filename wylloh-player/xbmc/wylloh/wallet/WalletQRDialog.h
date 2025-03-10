/*
 *  Copyright (C) 2023-2025 Wylloh Team
 *  This file is part of Wylloh Player - https://wylloh.com
 */

#pragma once

#include "dialogs/GUIDialogBoxBase.h"
#include "guilib/GUIImage.h"
#include "guilib/GUILabelControl.h"
#include "guilib/GUISpinControlEx.h"
#include "threads/Timer.h"
#include <string>

namespace WYLLOH {
namespace WALLET {

class CWalletConnection;

class CGUIDialogWalletQR : public CGUIDialogBoxBase, protected ITimerCallback
{
public:
  CGUIDialogWalletQR();
  ~CGUIDialogWalletQR() override;
  
  bool OnMessage(CGUIMessage& message) override;
  bool OnAction(const CAction& action) override;
  
  void Open(CWalletConnection* walletConnection);
  void Close(bool forceClose = false) override;
  
  void OnInitWindow() override;
  void OnDeinitWindow(int nextWindowID) override;
  
protected:
  void OnTimer() override;
  
  void SetQRImage(const std::string& url);
  void UpdateStatus();
  
private:
  CWalletConnection* m_walletConnection;
  CTimer m_statusTimer;
  CGUIImage* m_qrImage;
  CGUILabelControl* m_statusLabel;
  unsigned int m_checkCount;
  bool m_connectionComplete;
  std::string m_qrImageUrl;
};

}  // namespace WALLET
}  // namespace WYLLOH 