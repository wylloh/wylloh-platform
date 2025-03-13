/*
 *  Copyright (C) 2023-2025 Wylloh Team
 *  This file is part of Wylloh Player - https://wylloh.com
 */

#pragma once

#include "dialogs/GUIDialogBoxBase.h"
#include "FileItem.h"

namespace WYLLOH {

class CTokenInfoDialog : public CGUIDialogBoxBase
{
public:
  CTokenInfoDialog();
  ~CTokenInfoDialog() override;
  
  bool OnMessage(CGUIMessage& message) override;
  bool OnAction(const CAction& action) override;
  
  void SetToken(const CFileItem& item);
  
  void OnInitWindow() override;
  void OnDeinitWindow(int nextWindowID) override;
  
private:
  CFileItem m_token;
};

} // namespace WYLLOH 