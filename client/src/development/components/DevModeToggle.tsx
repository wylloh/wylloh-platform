/**
 * Development Mode Toggle Component
 * Allows users to enable/disable development features
 */

import React from 'react';
import { useDevMode } from '../hooks/useDevMode';

interface DevModeToggleProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'switch' | 'button' | 'badge';
}

export function DevModeToggle({ 
  className = '', 
  showLabel = true, 
  variant = 'switch' 
}: DevModeToggleProps) {
  const { isEnabled, canAccess, isLoading, toggleDevMode } = useDevMode();

  // Don't render if user can't access dev features
  if (!canAccess || isLoading) {
    return null;
  }

  const handleToggle = async () => {
    await toggleDevMode();
  };

  if (variant === 'badge') {
    return (
      <div className={`dev-mode-badge ${className}`}>
        <span 
          className={`badge ${isEnabled ? 'badge-warning' : 'badge-secondary'}`}
          onClick={handleToggle}
          style={{ cursor: 'pointer' }}
        >
          {isEnabled ? '🔧 DEV MODE' : '🔧 DEV'}
        </span>
      </div>
    );
  }

  if (variant === 'button') {
    return (
      <button
        className={`btn ${isEnabled ? 'btn-warning' : 'btn-outline-secondary'} ${className}`}
        onClick={handleToggle}
        title={isEnabled ? 'Disable Development Mode' : 'Enable Development Mode'}
      >
        🔧 {showLabel && (isEnabled ? 'Dev Mode ON' : 'Dev Mode OFF')}
      </button>
    );
  }

  // Default switch variant
  return (
    <div className={`dev-mode-toggle ${className}`}>
      {showLabel && (
        <label className="form-label me-2">
          Development Mode
        </label>
      )}
      <div className="form-check form-switch">
        <input
          className="form-check-input"
          type="checkbox"
          id="devModeSwitch"
          checked={isEnabled}
          onChange={handleToggle}
        />
        <label className="form-check-label" htmlFor="devModeSwitch">
          {isEnabled ? 'Enabled' : 'Disabled'}
        </label>
      </div>
      {isEnabled && (
        <small className="text-warning d-block mt-1">
          ⚠️ Development features are active
        </small>
      )}
    </div>
  );
}

/**
 * Development Mode Status Indicator
 * Shows current dev mode status in the UI
 */
export function DevModeStatus() {
  const { isEnabled, canAccess, config } = useDevMode();

  if (!canAccess || !isEnabled) {
    return null;
  }

  return (
    <div className="dev-mode-status">
      <div className="alert alert-warning alert-dismissible fade show" role="alert">
        <strong>🔧 Development Mode Active</strong>
        <ul className="mb-0 mt-2">
          {config.showTestContent && <li>Test content visible</li>}
          {config.showContentLabels && <li>Content labels shown</li>}
          {config.enableDebugMode && <li>Debug mode enabled</li>}
          {config.mockServices && <li>Mock services active</li>}
        </ul>
      </div>
    </div>
  );
}

/**
 * Development Mode Configuration Panel
 * Allows fine-grained control of dev mode settings
 */
export function DevModeConfig() {
  const { config, updateConfig, canAccess } = useDevMode();

  if (!canAccess) {
    return null;
  }

  const handleConfigChange = (key: keyof typeof config, value: any) => {
    updateConfig({ [key]: value });
  };

  return (
    <div className="dev-mode-config">
      <h6>Development Configuration</h6>
      
      <div className="form-check">
        <input
          className="form-check-input"
          type="checkbox"
          id="showTestContent"
          checked={config.showTestContent}
          onChange={(e) => handleConfigChange('showTestContent', e.target.checked)}
        />
        <label className="form-check-label" htmlFor="showTestContent">
          Show test content
        </label>
      </div>

      <div className="form-check">
        <input
          className="form-check-input"
          type="checkbox"
          id="showContentLabels"
          checked={config.showContentLabels}
          onChange={(e) => handleConfigChange('showContentLabels', e.target.checked)}
        />
        <label className="form-check-label" htmlFor="showContentLabels">
          Show content classification labels
        </label>
      </div>

      <div className="form-check">
        <input
          className="form-check-input"
          type="checkbox"
          id="enableDebugMode"
          checked={config.enableDebugMode}
          onChange={(e) => handleConfigChange('enableDebugMode', e.target.checked)}
        />
        <label className="form-check-label" htmlFor="enableDebugMode">
          Enable debug mode
        </label>
      </div>

      <div className="form-check">
        <input
          className="form-check-input"
          type="checkbox"
          id="mockServices"
          checked={config.mockServices}
          onChange={(e) => handleConfigChange('mockServices', e.target.checked)}
        />
        <label className="form-check-label" htmlFor="mockServices">
          Use mock services
        </label>
      </div>

      <div className="mb-3">
        <label htmlFor="logLevel" className="form-label">Log Level</label>
        <select
          className="form-select"
          id="logLevel"
          value={config.logLevel}
          onChange={(e) => handleConfigChange('logLevel', e.target.value)}
        >
          <option value="debug">Debug</option>
          <option value="info">Info</option>
          <option value="warn">Warning</option>
          <option value="error">Error</option>
        </select>
      </div>
    </div>
  );
} 