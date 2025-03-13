/*
 *  Copyright (C) 2023-2025 Wylloh Team
 *  This file is part of Wylloh Player - https://wylloh.com
 */

#pragma once

#include <string>
#include <vector>
#include "threads/CriticalSection.h"
#include "settings/lib/ISettingCallback.h"

namespace WYLLOH {
namespace IPFS {

/**
 * @class CIPFSSettings
 * @brief Manages IPFS configuration settings
 */
class CIPFSSettings : public ISettingCallback
{
public:
  static CIPFSSettings& GetInstance();

  bool Initialize();
  void Shutdown();

  // ISettingCallback implementation
  void OnSettingChanged(const std::shared_ptr<const CSetting>& setting) override;

  // Gateway management
  const std::vector<std::string>& GetGateways() const { return m_gateways; }
  void AddGateway(const std::string& gateway);
  void RemoveGateway(const std::string& gateway);
  void ClearGateways();

  // Primary gateway
  std::string GetPrimaryGateway() const;
  void SetPrimaryGateway(const std::string& gateway);

  // Timeout settings
  int GetRequestTimeoutMs() const { return m_timeoutMs; }
  void SetRequestTimeoutMs(int timeoutMs);

  // Cache settings
  std::string GetCachePath() const { return m_cachePath; }
  void SetCachePath(const std::string& path);
  
  int GetCacheMaxSizeMB() const { return m_cacheMaxSizeMB; }
  void SetCacheMaxSizeMB(int maxSizeMB);
  
  int GetCacheExpiryHours() const { return m_cacheExpiryHours; }
  void SetCacheExpiryHours(int hours);

  // Pin settings
  bool IsPinningEnabled() const { return m_enablePinning; }
  void SetPinningEnabled(bool enabled);

private:
  CIPFSSettings();
  ~CIPFSSettings();

  bool LoadSettings();
  bool SaveSettings();

  CCriticalSection m_criticalSection;
  std::vector<std::string> m_gateways;
  std::string m_primaryGateway;
  int m_timeoutMs;
  std::string m_cachePath;
  int m_cacheMaxSizeMB;
  int m_cacheExpiryHours;
  bool m_enablePinning;
  bool m_initialized;
};

} // namespace IPFS
} // namespace WYLLOH 