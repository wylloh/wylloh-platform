/**
 * Content Classification UI Components
 * Provides visual indicators and controls for content classification
 */

import React, { useState, useEffect } from 'react';
import { useDevMode } from '../hooks/useDevMode';
import { contentFilterService, ContentItem, ContentFilterOptions, FilteredContent } from '../services/contentFilter.service';
import { ContentClass, TestMetadata } from '../../types/user.types';

interface ContentLabelProps {
  contentClass: ContentClass;
  testMetadata?: TestMetadata;
  size?: 'small' | 'medium' | 'large';
  showDescription?: boolean;
}

/**
 * Content Classification Label
 * Shows the classification status of content items
 */
export function ContentLabel({ 
  contentClass, 
  testMetadata, 
  size = 'medium',
  showDescription = false 
}: ContentLabelProps) {
  const { config } = useDevMode();
  
  // Don't show labels if not enabled in dev config
  if (!config.showContentLabels) {
    return null;
  }

  const label = contentFilterService.getContentLabel(contentClass, testMetadata);
  
  const sizeClasses = {
    small: 'badge-sm',
    medium: '',
    large: 'badge-lg'
  };

  const colorClasses = {
    success: 'badge-success',
    warning: 'badge-warning',
    info: 'badge-info',
    secondary: 'badge-secondary',
    error: 'badge-danger'
  };

  return (
    <div className="content-label">
      <span 
        className={`badge ${colorClasses[label.color as keyof typeof colorClasses]} ${sizeClasses[size]}`}
        title={label.description}
      >
        {label.icon} {label.text}
      </span>
      {showDescription && (
        <small className="text-muted d-block mt-1">
          {label.description}
        </small>
      )}
      {testMetadata?.expirationIntent && (
        <small className="text-warning d-block mt-1">
          Expires: {new Date(testMetadata.expirationIntent).toLocaleDateString()}
        </small>
      )}
    </div>
  );
}

interface ContentFilterControlsProps {
  onFilterChange: (options: ContentFilterOptions) => void;
  currentOptions: ContentFilterOptions;
  contentStats?: {
    total: number;
    byClassification: Record<ContentClass, number>;
  };
}

/**
 * Content Filter Controls
 * Allows users to control what content types are visible
 */
export function ContentFilterControls({ 
  onFilterChange, 
  currentOptions,
  contentStats 
}: ContentFilterControlsProps) {
  const { canAccess, hasDevPermission } = useDevMode();
  const [canViewTest, setCanViewTest] = useState(false);
  const [canViewDev, setCanViewDev] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      const testPerm = await hasDevPermission('viewTestContent');
      const devPerm = await hasDevPermission('accessDevTools');
      setCanViewTest(testPerm);
      setCanViewDev(devPerm);
    };
    
    if (canAccess) {
      checkPermissions();
    }
  }, [canAccess, hasDevPermission]);

  if (!canAccess) {
    return null;
  }

  const handleOptionChange = (key: keyof ContentFilterOptions, value: boolean) => {
    onFilterChange({
      ...currentOptions,
      [key]: value
    });
  };

  return (
    <div className="content-filter-controls">
      <div className="card">
        <div className="card-header">
          <h6 className="mb-0">🔍 Content Filters</h6>
        </div>
        <div className="card-body">
          {/* Content Type Filters */}
          <div className="mb-3">
            <label className="form-label">Content Types</label>
            
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="includeDemoContent"
                checked={currentOptions.includeDemoContent || false}
                onChange={(e) => handleOptionChange('includeDemoContent', e.target.checked)}
              />
              <label className="form-check-label" htmlFor="includeDemoContent">
                🎬 Demo Content
                {contentStats && (
                  <span className="badge badge-info ms-2">
                    {contentStats.byClassification.demo || 0}
                  </span>
                )}
              </label>
            </div>

            {canViewTest && (
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="includeTestContent"
                  checked={currentOptions.includeTestContent || false}
                  onChange={(e) => handleOptionChange('includeTestContent', e.target.checked)}
                />
                <label className="form-check-label" htmlFor="includeTestContent">
                  🧪 Test Content
                  {contentStats && (
                    <span className="badge badge-warning ms-2">
                      {contentStats.byClassification.test || 0}
                    </span>
                  )}
                </label>
              </div>
            )}

            {canViewDev && (
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="includeDevContent"
                  checked={currentOptions.includeDevContent || false}
                  onChange={(e) => handleOptionChange('includeDevContent', e.target.checked)}
                />
                <label className="form-check-label" htmlFor="includeDevContent">
                  🔧 Development Content
                  {contentStats && (
                    <span className="badge badge-secondary ms-2">
                      {contentStats.byClassification.development || 0}
                    </span>
                  )}
                </label>
              </div>
            )}
          </div>

          {/* Display Options */}
          <div className="mb-3">
            <label className="form-label">Display Options</label>
            
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="showContentLabels"
                checked={currentOptions.showContentLabels || false}
                onChange={(e) => handleOptionChange('showContentLabels', e.target.checked)}
              />
              <label className="form-check-label" htmlFor="showContentLabels">
                🏷️ Show Content Labels
              </label>
            </div>
          </div>

          {/* Content Statistics */}
          {contentStats && (
            <div className="mt-3">
              <small className="text-muted">
                <strong>Total Content:</strong> {contentStats.total}
                <br />
                <strong>Production:</strong> {contentStats.byClassification.production || 0} |{' '}
                <strong>Demo:</strong> {contentStats.byClassification.demo || 0} |{' '}
                <strong>Test:</strong> {contentStats.byClassification.test || 0} |{' '}
                <strong>Dev:</strong> {contentStats.byClassification.development || 0}
              </small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface TestContentCreatorProps {
  onContentCreated: (content: ContentItem) => void;
}

/**
 * Test Content Creator
 * Allows developers to create test content with proper classification
 */
export function TestContentCreator({ onContentCreated }: TestContentCreatorProps) {
  const { canAccess, hasDevPermission } = useDevMode();
  const [canCreateTest, setCanCreateTest] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    testSuite: 'manual-testing',
    purpose: 'development' as TestMetadata['purpose'],
    expirationHours: 24,
    tags: ''
  });

  useEffect(() => {
    const checkPermissions = async () => {
      const canCreate = await hasDevPermission('createTestContent');
      setCanCreateTest(canCreate);
    };
    
    if (canAccess) {
      checkPermissions();
    }
  }, [canAccess, hasDevPermission]);

  if (!canAccess || !canCreateTest) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const testContent = contentFilterService.createTestContent(
        {
          title: formData.title,
          description: formData.description
        },
        {
          testSuite: formData.testSuite,
          purpose: formData.purpose,
          expirationHours: formData.expirationHours,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
          developer: 'current-user' // This should come from auth context
        }
      );

      onContentCreated(testContent);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        testSuite: 'manual-testing',
        purpose: 'development',
        expirationHours: 24,
        tags: ''
      });
    } catch (error) {
      console.error('Failed to create test content:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="test-content-creator">
      <div className="card">
        <div className="card-header">
          <h6 className="mb-0">🧪 Create Test Content</h6>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="testTitle" className="form-label">Title</label>
              <input
                type="text"
                className="form-control"
                id="testTitle"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="testDescription" className="form-label">Description</label>
              <textarea
                className="form-control"
                id="testDescription"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="testSuite" className="form-label">Test Suite</label>
                  <select
                    className="form-select"
                    id="testSuite"
                    value={formData.testSuite}
                    onChange={(e) => setFormData(prev => ({ ...prev, testSuite: e.target.value }))}
                  >
                    <option value="manual-testing">Manual Testing</option>
                    <option value="ui-testing">UI Testing</option>
                    <option value="integration-testing">Integration Testing</option>
                    <option value="performance-testing">Performance Testing</option>
                    <option value="user-acceptance">User Acceptance</option>
                  </select>
                </div>
              </div>

              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="testPurpose" className="form-label">Purpose</label>
                  <select
                    className="form-select"
                    id="testPurpose"
                    value={formData.purpose}
                    onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value as TestMetadata['purpose'] }))}
                  >
                    <option value="development">Development</option>
                    <option value="unit-test">Unit Test</option>
                    <option value="integration-test">Integration Test</option>
                    <option value="demo">Demo</option>
                    <option value="community-test">Community Test</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="expirationHours" className="form-label">Expiration (hours)</label>
                  <input
                    type="number"
                    className="form-control"
                    id="expirationHours"
                    min="1"
                    max="168"
                    value={formData.expirationHours}
                    onChange={(e) => setFormData(prev => ({ ...prev, expirationHours: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="testTags" className="form-label">Tags (comma-separated)</label>
                  <input
                    type="text"
                    className="form-control"
                    id="testTags"
                    placeholder="ui, mobile, critical"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-warning"
              disabled={isCreating || !formData.title}
            >
              {isCreating ? 'Creating...' : '🧪 Create Test Content'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

interface ContentStatsDisplayProps {
  content: ContentItem[];
}

/**
 * Content Statistics Display
 * Shows overview of content classification and visibility
 */
export function ContentStatsDisplay({ content }: ContentStatsDisplayProps) {
  const { canAccess } = useDevMode();
  const [stats, setStats] = useState<ReturnType<typeof contentFilterService.getContentStatistics> | null>(null);

  useEffect(() => {
    if (content.length > 0) {
      const contentStats = contentFilterService.getContentStatistics(content);
      setStats(contentStats);
    }
  }, [content]);

  if (!canAccess || !stats) {
    return null;
  }

  return (
    <div className="content-stats-display">
      <div className="card">
        <div className="card-header">
          <h6 className="mb-0">📊 Content Statistics</h6>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-3">
              <div className="text-center">
                <h4 className="mb-1">{stats.total}</h4>
                <small className="text-muted">Total Items</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="text-center">
                <h4 className="mb-1 text-success">{stats.byClassification.production}</h4>
                <small className="text-muted">🟢 Production</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="text-center">
                <h4 className="mb-1 text-info">{stats.byClassification.demo}</h4>
                <small className="text-muted">🎬 Demo</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="text-center">
                <h4 className="mb-1 text-warning">{stats.byClassification.test}</h4>
                <small className="text-muted">🧪 Test</small>
              </div>
            </div>
          </div>

          <hr />

          <div className="row">
            <div className="col-md-4">
              <div className="text-center">
                <h5 className="mb-1 text-success">{stats.byVisibility.visible}</h5>
                <small className="text-muted">Visible</small>
              </div>
            </div>
            <div className="col-md-4">
              <div className="text-center">
                <h5 className="mb-1 text-secondary">{stats.byVisibility.hidden}</h5>
                <small className="text-muted">Hidden</small>
              </div>
            </div>
            <div className="col-md-4">
              <div className="text-center">
                <h5 className="mb-1 text-danger">{stats.byVisibility.expired}</h5>
                <small className="text-muted">Expired</small>
              </div>
            </div>
          </div>

          {stats.byClassification.development > 0 && (
            <div className="mt-3">
              <small className="text-muted">
                <strong>Development:</strong> {stats.byClassification.development} items
              </small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 