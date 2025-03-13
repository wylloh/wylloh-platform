/*
 *  Copyright (C) 2023-2025 Wylloh Team
 *  This file is part of Wylloh Player - https://wylloh.com
 */

#include "wylloh/browser/TokenBrowser.h"
#include "wylloh/WyllohManager.h"
#include "wylloh/wallet/WalletManager.h"
#include "Application.h"
#include "ServiceBroker.h"
#include "FileItem.h"
#include "FileItemList.h"
#include "guilib/GUIWindowManager.h"
#include "guilib/GUIMessage.h"
#include "guilib/LocalizeStrings.h"
#include "utils/log.h"
#include "utils/StringUtils.h"
#include "utils/URIUtils.h"
#include "URL.h"
#include "dialogs/GUIDialogOK.h"
#include "dialogs/GUIDialogProgress.h"
#include "messaging/helpers/DialogHelper.h"
#include "view/ViewStateSettings.h"
#include "settings/Settings.h"
#include "settings/SettingsComponent.h"
#include "TextureCache.h"
#include "filesystem/Directory.h"
#include "wylloh/browser/TokenInfoDialog.h"
#include "wylloh/browser/TokenMetadataService.h"

#define CONTROL_BTNVIEWASICONS      2
#define CONTROL_BTNSORTBY           3
#define CONTROL_BTNSORTASC          4
#define CONTROL_BTNTYPE             5
#define CONTROL_BTNFILTER           6
#define CONTROL_BTNREFRESH          7
#define CONTROL_BTNWALLET           8
#define CONTROL_LABELFILES          12

#define TOKEN_BROWSER_WINDOW        10100
#define TOKEN_BROWSER_PATH          "wylloh://tokens/"

namespace WYLLOH {

CTokenBrowser::CTokenBrowser()
  : CGUIWindow(TOKEN_BROWSER_WINDOW, "TokenBrowser.xml"),
    CJobQueue(false, 1, CJob::PRIORITY_HIGH),
    m_tokenItems(new CFileItemList),
    m_filteredItems(new CFileItemList),
    m_isFetching(false),
    m_sortMethod(SORT_METHOD_NAME),
    m_currentFilter(""),
    m_itemsPerPage(20),
    m_currentPage(0),
    m_totalPages(0)
{
  m_loadType = LOAD_ON_GUI_INIT;
  m_rootDir.AllowNonLocalSources(false);
}

CTokenBrowser::~CTokenBrowser()
{
  delete m_tokenItems;
  delete m_filteredItems;
}

bool CTokenBrowser::OnMessage(CGUIMessage& message)
{
  switch (message.GetMessage())
  {
    case GUI_MSG_WINDOW_DEINIT:
    {
      CancelJobs();
      m_tokenItems->Clear();
      m_filteredItems->Clear();
      break;
    }
    case GUI_MSG_WINDOW_INIT:
    {
      m_rootDir.SetMask("/\\.wylloh\\.token$/");
      break;
    }
    case GUI_MSG_CLICKED:
    {
      int iControl = message.GetSenderId();
      if (iControl == CONTROL_BTNREFRESH)
      {
        LoadTokens();
        return true;
      }
      else if (iControl == CONTROL_BTNSORTBY)
      {
        OnSort();
        return true;
      }
      else if (iControl == CONTROL_BTNFILTER)
      {
        OnFilterItems("");
        return true;
      }
      else if (iControl == CONTROL_BTNWALLET)
      {
        // Open wallet connection dialog
        auto& app = g_application;
        if (app.m_wyllohManager)
        {
          auto walletManager = app.m_wyllohManager->GetWalletManager();
          if (walletManager)
          {
            walletManager->ConnectWalletWithQR();
            // Refresh tokens after connection attempt
            LoadTokens();
          }
        }
        return true;
      }
      break;
    }
  }
  return CGUIWindow::OnMessage(message);
}

bool CTokenBrowser::OnAction(const CAction& action)
{
  if (action.GetID() == ACTION_PREVIOUS_MENU || action.GetID() == ACTION_NAV_BACK)
  {
    g_windowManager.PreviousWindow();
    return true;
  }
  return CGUIWindow::OnAction(action);
}

void CTokenBrowser::OnInitWindow()
{
  CGUIWindow::OnInitWindow();
  
  // Set window title
  SET_CONTROL_LABEL(CONTROL_LABELFILES, g_localizeStrings.Get(30550)); // "My Tokens"
  
  // Update buttons
  UpdateButtons();
  
  // Load tokens
  LoadTokens();
}

void CTokenBrowser::OnDeinitWindow(int nextWindowID)
{
  CGUIWindow::OnDeinitWindow(nextWindowID);
}

bool CTokenBrowser::Update(const std::string& strDirectory, bool updateFilterPath)
{
  if (m_isFetching)
    return false;
    
  // Always use the token path
  if (strDirectory != TOKEN_BROWSER_PATH)
    return false;
    
  // Apply current filter and sorting
  OnFilterItems(m_currentFilter);
  
  return true;
}

bool CTokenBrowser::GetDirectory(const std::string& strDirectory, CFileItemList& items)
{
  // We handle this differently - we load tokens from the wallet
  return false;
}

void CTokenBrowser::GetContextButtons(int itemNumber, CContextButtons& buttons)
{
  if (itemNumber < 0 || itemNumber >= m_filteredItems->Size())
    return;
    
  CFileItemPtr item = m_filteredItems->Get(itemNumber);
  if (!item)
    return;
    
  // Add "Play" button
  buttons.Add(CONTEXT_BUTTON_PLAY_ITEM, 208); // "Play"
  
  // Add "Information" button
  buttons.Add(CONTEXT_BUTTON_INFO, 19033); // "Information"
}

bool CTokenBrowser::OnContextButton(int itemNumber, CONTEXT_BUTTON button)
{
  if (itemNumber < 0 || itemNumber >= m_filteredItems->Size())
    return false;
    
  CFileItemPtr item = m_filteredItems->Get(itemNumber);
  if (!item)
    return false;
    
  switch (button)
  {
    case CONTEXT_BUTTON_PLAY_ITEM:
      return OnClick(itemNumber);
      
    case CONTEXT_BUTTON_INFO:
      OnItemInfo(itemNumber);
      return true;
      
    default:
      break;
  }
  
  return CGUIWindow::OnContextButton(itemNumber, button);
}

bool CTokenBrowser::OnClick(int iItem, const std::string& player)
{
  if (iItem < 0 || iItem >= m_filteredItems->Size())
    return false;
    
  CFileItemPtr item = m_filteredItems->Get(iItem);
  if (!item)
    return false;
    
  // Get content ID from item
  std::string contentId = item->GetProperty("contentId").asString();
  if (contentId.empty())
  {
    MESSAGING::HELPERS::ShowOKDialogText(CVariant{30507}, // "Wallet"
                                         CVariant{30551}); // "No content associated with this token"
    return false;
  }
  
  // Play the content
  CFileItem playItem(contentId, false);
  playItem.SetLabel(item->GetLabel());
  playItem.SetArt("thumb", item->GetArt("thumb"));
  
  return g_application.PlayMedia(playItem, "", PLAYLIST::TYPE_VIDEO);
}

void CTokenBrowser::UpdateButtons()
{
  // Update sort button label
  std::string sortLabel;
  switch (m_sortMethod)
  {
    case SORT_METHOD_NAME:
      sortLabel = g_localizeStrings.Get(551); // "Name"
      break;
    case SORT_METHOD_DATE:
      sortLabel = g_localizeStrings.Get(552); // "Date"
      break;
    case SORT_METHOD_TYPE:
      sortLabel = g_localizeStrings.Get(557); // "Type"
      break;
    default:
      sortLabel = g_localizeStrings.Get(551); // "Name"
      break;
  }
  
  SET_CONTROL_LABEL(CONTROL_BTNSORTBY, sortLabel);
  
  // Update filter button label
  std::string filterLabel = g_localizeStrings.Get(587); // "Filter"
  if (!m_currentFilter.empty())
  {
    filterLabel += ": " + m_currentFilter;
  }
  
  SET_CONTROL_LABEL(CONTROL_BTNFILTER, filterLabel);
  
  // Update wallet button label
  auto& app = g_application;
  if (app.m_wyllohManager)
  {
    auto walletManager = app.m_wyllohManager->GetWalletManager();
    if (walletManager && walletManager->IsConnected())
    {
      SET_CONTROL_LABEL(CONTROL_BTNWALLET, g_localizeStrings.Get(30511)); // "Connected"
    }
    else
    {
      SET_CONTROL_LABEL(CONTROL_BTNWALLET, g_localizeStrings.Get(30513)); // "Connect Wallet"
    }
  }
}

void CTokenBrowser::OnItemInfo(int iItem)
{
  if (iItem < 0 || iItem >= m_filteredItems->Size())
    return;
    
  CFileItemPtr item = m_filteredItems->Get(iItem);
  if (!item)
    return;
    
  // Show token information dialog
  CTokenInfoDialog* dialog = new CTokenInfoDialog();
  if (dialog)
  {
    dialog->SetToken(*item);
    dialog->Open();
    delete dialog;
  }
}

void CTokenBrowser::OnSort()
{
  // Cycle through sort methods
  switch (m_sortMethod)
  {
    case SORT_METHOD_NAME:
      m_sortMethod = SORT_METHOD_DATE;
      break;
    case SORT_METHOD_DATE:
      m_sortMethod = SORT_METHOD_TYPE;
      break;
    case SORT_METHOD_TYPE:
      m_sortMethod = SORT_METHOD_NAME;
      break;
    default:
      m_sortMethod = SORT_METHOD_NAME;
      break;
  }
  
  // Apply sort method
  if (m_filteredItems->Size() > 0)
  {
    switch (m_sortMethod)
    {
      case SORT_METHOD_NAME:
        m_filteredItems->Sort(SortByLabel, SortOrderAscending);
        break;
      case SORT_METHOD_DATE:
        m_filteredItems->Sort(SortByDate, SortOrderDescending);
        break;
      case SORT_METHOD_TYPE:
        m_filteredItems->Sort(SortByType, SortOrderAscending);
        break;
      default:
        m_filteredItems->Sort(SortByLabel, SortOrderAscending);
        break;
    }
  }
  
  // Update buttons
  UpdateButtons();
  
  // Refresh list
  CGUIMessage msg(GUI_MSG_REFRESH_LIST, GetID(), 0);
  OnMessage(msg);
}

void CTokenBrowser::OnFilterItems(const std::string& filter)
{
  CSingleLock lock(m_criticalSection);
  
  // If filter is empty, show all items
  if (filter.empty())
  {
    m_currentFilter = "";
    m_filteredItems->Clear();
    m_filteredItems->Append(*m_tokenItems);
  }
  else
  {
    m_currentFilter = filter;
    m_filteredItems->Clear();
    
    // Filter items by name
    for (int i = 0; i < m_tokenItems->Size(); i++)
    {
      CFileItemPtr item = m_tokenItems->Get(i);
      if (StringUtils::ContainsNoCase(item->GetLabel(), filter))
      {
        m_filteredItems->Add(item);
      }
    }
  }
  
  // Apply current sort method
  OnSort();
  
  // Update buttons
  UpdateButtons();
  
  // Refresh list
  CGUIMessage msg(GUI_MSG_REFRESH_LIST, GetID(), 0);
  OnMessage(msg);
}

void CTokenBrowser::FormatItemLabels(CFileItemList& items)
{
  // Initialize token metadata service
  CTokenMetadataService::GetInstance().Initialize();
  
  for (int i = 0; i < items.Size(); i++)
  {
    CFileItemPtr item = items[i];
    
    // Enhance item with metadata
    if (CTokenMetadataService::GetInstance().EnhanceTokenItem(*item))
    {
      // Metadata was successfully applied
      continue;
    }
    
    // Fallback if metadata service failed
    std::string tokenName = item->GetProperty("name").asString();
    std::string tokenType = item->GetProperty("type").asString();
    
    if (tokenName.empty())
    {
      tokenName = StringUtils::Format("Token #%s", item->GetProperty("tokenId").asString().c_str());
    }
    
    item->SetLabel(tokenName);
    item->SetLabel2(tokenType);
    
    // Set artwork
    std::string thumbUrl = item->GetProperty("imageUrl").asString();
    if (!thumbUrl.empty())
    {
      item->SetArt("thumb", thumbUrl);
    }
    else
    {
      // Use placeholder
      item->SetArt("thumb", "special://xbmc/media/wylloh/tokens/placeholder.svg");
    }
  }
}

void CTokenBrowser::OnSearch()
{
  // TODO: Implement search functionality
}

void CTokenBrowser::LoadTokens()
{
  if (m_isFetching)
    return;
    
  m_isFetching = true;
  
  // Show progress dialog
  CGUIDialogProgress* pDlgProgress = g_windowManager.GetWindow<CGUIDialogProgress>(WINDOW_DIALOG_PROGRESS);
  if (pDlgProgress)
  {
    pDlgProgress->SetHeading(CVariant{30550}); // "My Tokens"
    pDlgProgress->SetLine(0, CVariant{30552}); // "Loading tokens..."
    pDlgProgress->SetLine(1, CVariant{""});
    pDlgProgress->SetLine(2, CVariant{""});
    pDlgProgress->Open();
    pDlgProgress->ShowProgressBar(true);
    pDlgProgress->SetPercentage(0);
  }
  
  // Check if wallet is connected
  auto& app = g_application;
  if (!app.m_wyllohManager || !app.m_wyllohManager->GetWalletManager() || 
      !app.m_wyllohManager->GetWalletManager()->IsConnected())
  {
    // Wallet not connected
    if (pDlgProgress)
    {
      pDlgProgress->Close();
    }
    
    m_isFetching = false;
    
    // Show wallet connection dialog
    bool confirmed = MESSAGING::HELPERS::ShowYesNoDialogText(
      CVariant{30507}, // "Wallet"
      CVariant{30553}, // "You need to connect your wallet to view your tokens. Connect now?"
      CVariant{30522}, // "Connect"
      CVariant{30523}  // "Cancel"
    );
    
    if (confirmed && app.m_wyllohManager)
    {
      auto walletManager = app.m_wyllohManager->GetWalletManager();
      if (walletManager)
      {
        walletManager->ConnectWalletWithQR();
        // Try loading tokens again after connection
        LoadTokens();
      }
    }
    
    return;
  }
  
  // Start token fetch job
  CTokenFetchJob* job = new CTokenFetchJob();
  AddJob(job);
  
  // Update progress dialog
  if (pDlgProgress)
  {
    pDlgProgress->SetPercentage(50);
  }
}

void CTokenBrowser::OnJobComplete(unsigned int jobID, bool success, CJob* job)
{
  // Close progress dialog
  CGUIDialogProgress* pDlgProgress = g_windowManager.GetWindow<CGUIDialogProgress>(WINDOW_DIALOG_PROGRESS);
  if (pDlgProgress)
  {
    pDlgProgress->Close();
  }
  
  if (success)
  {
    CTokenFetchJob* fetchJob = static_cast<CTokenFetchJob*>(job);
    if (fetchJob)
    {
      CSingleLock lock(m_criticalSection);
      
      // Clear current items
      m_tokenItems->Clear();
      
      // Get new items
      CFileItemList* newItems = fetchJob->GetTokenItems();
      if (newItems && newItems->Size() > 0)
      {
        m_tokenItems->Append(*newItems);
        
        // Format item labels
        FormatItemLabels(*m_tokenItems);
        
        // Apply filter
        OnFilterItems(m_currentFilter);
      }
      else
      {
        // No tokens found
        m_filteredItems->Clear();
        
        // Show message
        CGUIDialogOK::ShowAndGetInput(CVariant{30550}, // "My Tokens"
                                      CVariant{30554}); // "No tokens found for your wallet"
      }
    }
  }
  else
  {
    // Job failed
    CGUIDialogOK::ShowAndGetInput(CVariant{30550}, // "My Tokens"
                                  CVariant{30555}); // "Failed to load tokens"
  }
  
  m_isFetching = false;
  
  // Update buttons
  UpdateButtons();
  
  // Refresh list
  CGUIMessage msg(GUI_MSG_REFRESH_LIST, GetID(), 0);
  OnMessage(msg);
}

// Token Fetch Job Implementation
CTokenFetchJob::CTokenFetchJob()
  : m_tokenItems(new CFileItemList)
{
}

CTokenFetchJob::~CTokenFetchJob()
{
  delete m_tokenItems;
}

bool CTokenFetchJob::DoWork()
{
  // Get owned content IDs from WyllohManager
  auto& app = g_application;
  if (!app.m_wyllohManager)
    return false;
    
  std::vector<std::string> contentIds = app.m_wyllohManager->GetOwnedContentIds();
  if (contentIds.empty())
    return true; // No tokens, but not an error
    
  // Create file items for each token
  for (const auto& contentId : contentIds)
  {
    CFileItemPtr item(new CFileItem(contentId));
    
    // Set item properties
    item->SetProperty("contentId", contentId);
    item->SetProperty("tokenId", contentId); // For now, use contentId as tokenId
    item->SetProperty("name", "Token #" + contentId.substr(0, 8)); // Placeholder name
    item->SetProperty("type", "Video"); // Placeholder type
    item->SetProperty("description", "Token for content ID: " + contentId); // Placeholder description
    
    // TODO: Get actual token metadata from API
    
    // Add item to list
    m_tokenItems->Add(item);
  }
  
  return true;
}

} // namespace WYLLOH 