/*
 *  Copyright (C) 2023-2025 Wylloh Team
 *  This file is part of Wylloh Player - https://wylloh.com
 */

#pragma once

#include "windows/GUIWindow.h"
#include "threads/CriticalSection.h"
#include "threads/Thread.h"
#include "utils/Job.h"
#include "FileItem.h"
#include <vector>
#include <memory>

namespace WYLLOH {

class CTokenBrowser : public CGUIWindow, public CJobQueue
{
public:
  CTokenBrowser();
  ~CTokenBrowser() override;

  bool OnMessage(CGUIMessage& message) override;
  bool OnAction(const CAction& action) override;
  void OnInitWindow() override;
  void OnDeinitWindow(int nextWindowID) override;
  bool Update(const std::string& strDirectory, bool updateFilterPath = true) override;
  bool GetDirectory(const std::string& strDirectory, CFileItemList& items) override;

protected:
  void GetContextButtons(int itemNumber, CContextButtons& buttons) override;
  bool OnContextButton(int itemNumber, CONTEXT_BUTTON button) override;
  bool OnClick(int iItem, const std::string& player = "") override;
  void UpdateButtons();
  void OnItemInfo(int iItem);
  void OnSort();
  void OnFilterItems(const std::string& filter);
  void FormatItemLabels(CFileItemList& items);
  void OnSearch();
  void LoadTokens();
  void OnJobComplete(unsigned int jobID, bool success, CJob* job) override;

private:
  enum SortMethod {
    SORT_METHOD_NAME,
    SORT_METHOD_DATE,
    SORT_METHOD_TYPE
  };

  CCriticalSection m_criticalSection;
  CFileItemList* m_tokenItems;
  CFileItemList* m_filteredItems;
  bool m_isFetching;
  SortMethod m_sortMethod;
  std::string m_currentFilter;
  int m_itemsPerPage;
  int m_currentPage;
  int m_totalPages;
};

class CTokenFetchJob : public CJob
{
public:
  CTokenFetchJob();
  ~CTokenFetchJob() override;

  bool DoWork() override;
  CFileItemList* GetTokenItems() { return m_tokenItems; }

private:
  CFileItemList* m_tokenItems;
};

} // namespace WYLLOH 