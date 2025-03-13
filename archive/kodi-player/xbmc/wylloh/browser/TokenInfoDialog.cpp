/*
 *  Copyright (C) 2023-2025 Wylloh Team
 *  This file is part of Wylloh Player - https://wylloh.com
 */

#include "wylloh/browser/TokenInfoDialog.h"
#include "guilib/GUIWindowManager.h"
#include "guilib/GUIMessage.h"
#include "guilib/LocalizeStrings.h"
#include "utils/StringUtils.h"
#include "utils/Variant.h"
#include "FileItem.h"

#define TOKEN_INFO_DIALOG_ID 10101

#define CONTROL_TOKEN_NAME 1
#define CONTROL_TOKEN_IMAGE 2
#define CONTROL_TOKEN_ID_LABEL 3
#define CONTROL_TOKEN_ID_VALUE 4
#define CONTROL_CONTENT_ID_LABEL 5
#define CONTROL_CONTENT_ID_VALUE 6
#define CONTROL_TYPE_LABEL 7
#define CONTROL_TYPE_VALUE 8
#define CONTROL_ACQUIRED_LABEL 9
#define CONTROL_ACQUIRED_VALUE 10
#define CONTROL_DESCRIPTION_LABEL 11
#define CONTROL_DESCRIPTION_VALUE 12
#define CONTROL_CLOSE_BUTTON 13

namespace WYLLOH {

CTokenInfoDialog::CTokenInfoDialog()
  : CGUIDialogBoxBase(TOKEN_INFO_DIALOG_ID, "DialogTokenInfo.xml")
{
  m_loadType = LOAD_ON_GUI_INIT;
}

CTokenInfoDialog::~CTokenInfoDialog()
{
}

bool CTokenInfoDialog::OnMessage(CGUIMessage& message)
{
  if (message.GetMessage() == GUI_MSG_CLICKED)
  {
    int controlId = message.GetSenderId();
    if (controlId == CONTROL_CLOSE_BUTTON)
    {
      Close();
      return true;
    }
  }
  
  return CGUIDialogBoxBase::OnMessage(message);
}

bool CTokenInfoDialog::OnAction(const CAction& action)
{
  if (action.GetID() == ACTION_PREVIOUS_MENU || action.GetID() == ACTION_NAV_BACK)
  {
    Close();
    return true;
  }
  
  return CGUIDialogBoxBase::OnAction(action);
}

void CTokenInfoDialog::SetToken(const CFileItem& item)
{
  m_token = item;
}

void CTokenInfoDialog::OnInitWindow()
{
  CGUIDialogBoxBase::OnInitWindow();
  
  // Set dialog title
  SetHeading(CVariant{30556}); // "Token Information"
  
  // Set token name
  SET_CONTROL_LABEL(CONTROL_TOKEN_NAME, m_token.GetLabel());
  
  // Set token image
  CGUIMessage msg(GUI_MSG_SET_FILENAME, GetID(), CONTROL_TOKEN_IMAGE);
  msg.SetLabel(m_token.GetArt("thumb"));
  OnMessage(msg);
  
  // Set token ID label and value
  SET_CONTROL_LABEL(CONTROL_TOKEN_ID_LABEL, g_localizeStrings.Get(30557)); // "Token ID"
  SET_CONTROL_LABEL(CONTROL_TOKEN_ID_VALUE, m_token.GetProperty("tokenId").asString());
  
  // Set content ID label and value
  SET_CONTROL_LABEL(CONTROL_CONTENT_ID_LABEL, g_localizeStrings.Get(30558)); // "Content ID"
  SET_CONTROL_LABEL(CONTROL_CONTENT_ID_VALUE, m_token.GetProperty("contentId").asString());
  
  // Set type label and value
  SET_CONTROL_LABEL(CONTROL_TYPE_LABEL, g_localizeStrings.Get(30559)); // "Type"
  SET_CONTROL_LABEL(CONTROL_TYPE_VALUE, m_token.GetProperty("type").asString());
  
  // Set acquired label and value
  SET_CONTROL_LABEL(CONTROL_ACQUIRED_LABEL, g_localizeStrings.Get(30560)); // "Acquired"
  
  std::string acquiredDate = m_token.GetProperty("acquiredDate").asString();
  if (acquiredDate.empty())
  {
    acquiredDate = "Unknown";
  }
  SET_CONTROL_LABEL(CONTROL_ACQUIRED_VALUE, acquiredDate);
  
  // Set description label and value
  SET_CONTROL_LABEL(CONTROL_DESCRIPTION_LABEL, "Description");
  SET_CONTROL_LABEL(CONTROL_DESCRIPTION_VALUE, m_token.GetProperty("description").asString());
}

void CTokenInfoDialog::OnDeinitWindow(int nextWindowID)
{
  CGUIDialogBoxBase::OnDeinitWindow(nextWindowID);
}

} // namespace WYLLOH 