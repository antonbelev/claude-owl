import React, { useState, useMemo } from 'react';
import { usePlugins } from '../../hooks/usePlugins';
import type { MarketplacePlugin, InstalledPlugin, Marketplace } from '@/shared/types';
import './PluginsManager.css';

type TabView = 'browse' | 'installed' | 'marketplaces';
type ViewMode = 'grid' | 'list';

export const PluginsManager: React.FC = () => {
  const {
    marketplaces,
    availablePlugins,
    installedPlugins,
    loading,
    error,
    refetch,
    addMarketplace,
    removeMarketplace,
    installPlugin,
    uninstallPlugin,
    togglePlugin,
  } = usePlugins();

  const [activeTab, setActiveTab] = useState<TabView>('browse');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarketplace, setSelectedMarketplace] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterHasCommands, setFilterHasCommands] = useState(false);
  const [filterHasAgents, setFilterHasAgents] = useState(false);
  const [filterHasSkills, setFilterHasSkills] = useState(false);
  const [showAddMarketplaceModal, setShowAddMarketplaceModal] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState<MarketplacePlugin | InstalledPlugin | null>(null);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    [...availablePlugins, ...installedPlugins].forEach((p: MarketplacePlugin | InstalledPlugin) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats).sort();
  }, [availablePlugins, installedPlugins]);

  // Filter plugins based on active tab and filters
  const filteredPlugins = useMemo(() => {
    let plugins: (MarketplacePlugin | InstalledPlugin)[] =
      activeTab === 'installed' ? installedPlugins : availablePlugins;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      plugins = plugins.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.keywords?.some((k: string) => k.toLowerCase().includes(query))
      );
    }

    // Marketplace filter
    if (selectedMarketplace !== 'all') {
      plugins = plugins.filter(p => p.marketplace === selectedMarketplace);
    }

    // Category filter
    if (selectedCategory !== 'all') {
      plugins = plugins.filter(p => p.category === selectedCategory);
    }

    // Component filters
    if (filterHasCommands) {
      plugins = plugins.filter(p =>
        'componentCounts' in p ? p.componentCounts?.commands ?? 0 > 0 : false
      );
    }
    if (filterHasAgents) {
      plugins = plugins.filter(p =>
        'componentCounts' in p ? p.componentCounts?.agents ?? 0 > 0 : false
      );
    }
    if (filterHasSkills) {
      plugins = plugins.filter(p =>
        'componentCounts' in p ? p.componentCounts?.skills ?? 0 > 0 : false
      );
    }

    return plugins;
  }, [
    activeTab,
    availablePlugins,
    installedPlugins,
    searchQuery,
    selectedMarketplace,
    selectedCategory,
    filterHasCommands,
    filterHasAgents,
    filterHasSkills,
  ]);

  const handleInstallPlugin = async (plugin: MarketplacePlugin) => {
    const success = await installPlugin(plugin.name, plugin.marketplace);
    if (success) {
      setSelectedPlugin(null);
    }
  };

  const handleUninstallPlugin = async (plugin: InstalledPlugin) => {
    if (!confirm(`Are you sure you want to uninstall "${plugin.name}"?`)) {
      return;
    }
    const success = await uninstallPlugin(plugin.id);
    if (success) {
      setSelectedPlugin(null);
    }
  };

  const handleTogglePlugin = async (plugin: InstalledPlugin, enabled: boolean) => {
    await togglePlugin(plugin.id, enabled);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedMarketplace('all');
    setSelectedCategory('all');
    setFilterHasCommands(false);
    setFilterHasAgents(false);
    setFilterHasSkills(false);
  };

  if (loading) {
    return (
      <div className="plugins-manager" data-testid="plugins-manager">
        <div className="plugins-header">
          <h1>Plugins Manager</h1>
        </div>
        <div className="plugins-loading">
          <p>Loading plugins...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="plugins-manager" data-testid="plugins-manager">
        <div className="plugins-header">
          <h1>Plugins Manager</h1>
        </div>
        <div className="plugins-error">
          <p className="error-message">Error: {error}</p>
          <button onClick={refetch} className="btn-retry">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="plugins-manager" data-testid="plugins-manager">
      <div className="plugins-header">
        <div>
          <h1>Plugins</h1>
          <p className="header-description">
            Browse and manage plugins from marketplaces
          </p>
        </div>
        {activeTab === 'marketplaces' && (
          <button onClick={() => setShowAddMarketplaceModal(true)} className="btn-create">
            + Add Marketplace
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="plugins-tabs">
        <button
          className={`tab ${activeTab === 'browse' ? 'active' : ''}`}
          onClick={() => setActiveTab('browse')}
        >
          Browse Marketplace
          <span className="tab-count">{availablePlugins.length}</span>
        </button>
        <button
          className={`tab ${activeTab === 'installed' ? 'active' : ''}`}
          onClick={() => setActiveTab('installed')}
        >
          Installed
          <span className="tab-count">{installedPlugins.length}</span>
        </button>
        <button
          className={`tab ${activeTab === 'marketplaces' ? 'active' : ''}`}
          onClick={() => setActiveTab('marketplaces')}
        >
          Marketplaces
          <span className="tab-count">{marketplaces.length}</span>
        </button>
      </div>

      {/* Search and Filters (for browse and installed tabs) */}
      {(activeTab === 'browse' || activeTab === 'installed') && (
        <div className="plugins-controls">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search plugins by name, description, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="search-clear" title="Clear search">
                ✕
              </button>
            )}
          </div>

          <div className="filters">
            <select
              value={selectedMarketplace}
              onChange={(e) => setSelectedMarketplace(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Marketplaces</option>
              {marketplaces.map(m => (
                <option key={m.name} value={m.name}>{m.name}</option>
              ))}
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {activeTab === 'installed' && (
              <div className="filter-checkboxes">
                <label className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={filterHasCommands}
                    onChange={(e) => setFilterHasCommands(e.target.checked)}
                  />
                  Has Commands
                </label>
                <label className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={filterHasAgents}
                    onChange={(e) => setFilterHasAgents(e.target.checked)}
                  />
                  Has Agents
                </label>
                <label className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={filterHasSkills}
                    onChange={(e) => setFilterHasSkills(e.target.checked)}
                  />
                  Has Skills
                </label>
              </div>
            )}

            <div className="view-toggle">
              <button
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid view"
              >
                ⊞
              </button>
              <button
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List view"
              >
                ☰
              </button>
            </div>

            {(searchQuery || selectedMarketplace !== 'all' || selectedCategory !== 'all' ||
              filterHasCommands || filterHasAgents || filterHasSkills) && (
              <button onClick={clearFilters} className="btn-clear-filters">
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="plugins-content">
        {activeTab === 'marketplaces' ? (
          <MarketplacesView
            marketplaces={marketplaces}
            onRemove={removeMarketplace}
          />
        ) : filteredPlugins.length === 0 ? (
          <div className="plugins-empty">
            <div className="empty-icon">🔌</div>
            <h3>No Plugins Found</h3>
            <p>
              {searchQuery || selectedMarketplace !== 'all' || selectedCategory !== 'all'
                ? 'No plugins match your search criteria.'
                : activeTab === 'installed'
                ? 'You haven\'t installed any plugins yet.'
                : 'No plugins available in the marketplace.'}
            </p>
            {(searchQuery || selectedMarketplace !== 'all' || selectedCategory !== 'all') && (
              <button onClick={clearFilters} className="btn-create-empty">
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'plugins-grid' : 'plugins-list'}>
            {filteredPlugins.map((plugin) => (
              <PluginCard
                key={'id' in plugin ? plugin.id : `${plugin.name}@${plugin.marketplace}`}
                plugin={plugin}
                viewMode={viewMode}
                onView={setSelectedPlugin}
                onInstall={handleInstallPlugin}
                onUninstall={handleUninstallPlugin}
                onToggle={handleTogglePlugin}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddMarketplaceModal && (
        <AddMarketplaceModal
          onClose={() => setShowAddMarketplaceModal(false)}
          onAdd={addMarketplace}
        />
      )}

      {selectedPlugin && (
        <PluginDetailModal
          plugin={selectedPlugin}
          onClose={() => setSelectedPlugin(null)}
          onInstall={handleInstallPlugin}
          onUninstall={handleUninstallPlugin}
          onToggle={handleTogglePlugin}
        />
      )}
    </div>
  );
};

// Marketplaces View Component
interface MarketplacesViewProps {
  marketplaces: Marketplace[];
  onRemove: (name: string) => Promise<boolean>;
}

const MarketplacesView: React.FC<MarketplacesViewProps> = ({ marketplaces, onRemove }) => {
  const handleRemove = async (marketplace: Marketplace) => {
    if (!confirm(`Are you sure you want to remove the marketplace "${marketplace.name}"?`)) {
      return;
    }
    await onRemove(marketplace.name);
  };

  if (marketplaces.length === 0) {
    return (
      <div className="plugins-empty">
        <div className="empty-icon">🏪</div>
        <h3>No Marketplaces</h3>
        <p>Add a marketplace to browse and install plugins.</p>
      </div>
    );
  }

  return (
    <div className="marketplaces-list">
      {marketplaces.map((marketplace) => (
        <div key={marketplace.name} className="marketplace-card">
          <div className="marketplace-header">
            <div>
              <h3 className="marketplace-name">{marketplace.name}</h3>
              {marketplace.description && (
                <p className="marketplace-description">{marketplace.description}</p>
              )}
            </div>
            <span className={`marketplace-status ${marketplace.available ? 'available' : 'unavailable'}`}>
              {marketplace.available ? '✓ Available' : '✗ Unavailable'}
            </span>
          </div>

          <div className="marketplace-details">
            <div className="marketplace-meta">
              <div className="meta-item">
                <span className="meta-label">Source:</span>
                <code className="meta-value">{marketplace.source}</code>
              </div>
              <div className="meta-item">
                <span className="meta-label">Plugins:</span>
                <span className="meta-value">{marketplace.pluginCount}</span>
              </div>
              {marketplace.version && (
                <div className="meta-item">
                  <span className="meta-label">Version:</span>
                  <span className="meta-value">{marketplace.version}</span>
                </div>
              )}
            </div>

            {marketplace.error && (
              <div className="marketplace-error">
                <span>⚠ Error: {marketplace.error}</span>
              </div>
            )}
          </div>

          <div className="marketplace-actions">
            <button onClick={() => handleRemove(marketplace)} className="btn-danger-sm">
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Plugin Card Component
interface PluginCardProps {
  plugin: MarketplacePlugin | InstalledPlugin;
  viewMode: ViewMode;
  onView: (plugin: MarketplacePlugin | InstalledPlugin) => void;
  onInstall: (plugin: MarketplacePlugin) => void;
  onUninstall: (plugin: InstalledPlugin) => void;
  onToggle: (plugin: InstalledPlugin, enabled: boolean) => void;
}

const PluginCard: React.FC<PluginCardProps> = ({
  plugin,
  viewMode,
  onView,
  onInstall,
  onUninstall,
  onToggle
}) => {
  const isInstalled = 'id' in plugin;
  const marketplaceBadge = plugin.marketplace;

  const handleInstall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isInstalled) {
      onInstall(plugin as MarketplacePlugin);
    }
  };

  const handleUninstall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInstalled) {
      onUninstall(plugin as InstalledPlugin);
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInstalled) {
      onToggle(plugin as InstalledPlugin, !(plugin as InstalledPlugin).enabled);
    }
  };

  return (
    <div
      className={`plugin-card ${viewMode}-view ${isInstalled && !(plugin as InstalledPlugin).enabled ? 'disabled' : ''}`}
      onClick={() => onView(plugin)}
    >
      <div className="plugin-card-header">
        <div className="plugin-title">
          <h3 className="plugin-name">{plugin.name}</h3>
          {plugin.version && <span className="plugin-version">v{plugin.version}</span>}
        </div>
        <div className="plugin-badges">
          <span className="marketplace-badge">{marketplaceBadge}</span>
          {plugin.category && <span className="category-badge">{plugin.category}</span>}
          {isInstalled && (
            <span className={`status-badge ${(plugin as InstalledPlugin).enabled ? 'enabled' : 'disabled'}`}>
              {(plugin as InstalledPlugin).enabled ? 'Enabled' : 'Disabled'}
            </span>
          )}
        </div>
      </div>

      <p className="plugin-description">{plugin.description || 'No description available'}</p>

      {isInstalled && (plugin as InstalledPlugin).componentCounts && (
        <div className="plugin-components">
          {(plugin as InstalledPlugin).componentCounts!.commands > 0 && (
            <span className="component-badge">
              {(plugin as InstalledPlugin).componentCounts!.commands} command(s)
            </span>
          )}
          {(plugin as InstalledPlugin).componentCounts!.agents > 0 && (
            <span className="component-badge">
              {(plugin as InstalledPlugin).componentCounts!.agents} agent(s)
            </span>
          )}
          {(plugin as InstalledPlugin).componentCounts!.skills > 0 && (
            <span className="component-badge">
              {(plugin as InstalledPlugin).componentCounts!.skills} skill(s)
            </span>
          )}
        </div>
      )}

      <div className="plugin-card-actions">
        {isInstalled ? (
          <>
            <button onClick={handleToggle} className="btn-toggle">
              {(plugin as InstalledPlugin).enabled ? 'Disable' : 'Enable'}
            </button>
            <button onClick={handleUninstall} className="btn-uninstall">
              Uninstall
            </button>
          </>
        ) : (
          <button onClick={handleInstall} className="btn-install">
            {(plugin as MarketplacePlugin).installed ? 'Reinstall' : 'Install'}
          </button>
        )}
      </div>
    </div>
  );
};

// Add Marketplace Modal
interface AddMarketplaceModalProps {
  onClose: () => void;
  onAdd: (name: string, source: string) => Promise<boolean>;
}

const AddMarketplaceModal: React.FC<AddMarketplaceModalProps> = ({ onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [source, setSource] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !source.trim()) {
      setError('Name and source are required');
      return;
    }

    setAdding(true);
    setError('');

    const success = await onAdd(name.trim(), source.trim());

    if (success) {
      onClose();
    } else {
      setError('Failed to add marketplace. Please check the source and try again.');
    }

    setAdding(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Marketplace</h2>
          <button onClick={onClose} className="btn-close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && <div className="form-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="marketplace-name">
              Name <span className="required">*</span>
            </label>
            <input
              id="marketplace-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-marketplace"
              className="input-field"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="marketplace-source">
              Source <span className="required">*</span>
            </label>
            <input
              id="marketplace-source"
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="https://github.com/user/repo or /path/to/local/marketplace"
              className="input-field"
              required
            />
            <small>GitHub URL, Git URL, or local file path</small>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={adding}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={adding}>
              {adding ? 'Adding...' : 'Add Marketplace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Plugin Detail Modal
interface PluginDetailModalProps {
  plugin: MarketplacePlugin | InstalledPlugin;
  onClose: () => void;
  onInstall: (plugin: MarketplacePlugin) => void;
  onUninstall: (plugin: InstalledPlugin) => void;
  onToggle: (plugin: InstalledPlugin, enabled: boolean) => void;
}

const PluginDetailModal: React.FC<PluginDetailModalProps> = ({
  plugin,
  onClose,
  onInstall,
  onUninstall,
  onToggle
}) => {
  const isInstalled = 'id' in plugin;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{plugin.name}</h2>
            {plugin.version && <span className="plugin-version-large">v{plugin.version}</span>}
          </div>
          <button onClick={onClose} className="btn-close">×</button>
        </div>

        <div className="modal-body plugin-detail">
          <div className="detail-section">
            <h3>Description</h3>
            <p>{plugin.description || 'No description available'}</p>
          </div>

          {plugin.keywords && plugin.keywords.length > 0 && (
            <div className="detail-section">
              <h3>Keywords</h3>
              <div className="keyword-list">
                {plugin.keywords.map((kw: string, idx: number) => (
                  <span key={idx} className="keyword-badge">{kw}</span>
                ))}
              </div>
            </div>
          )}

          <div className="detail-section">
            <h3>Details</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Marketplace:</span>
                <span className="detail-value">{plugin.marketplace}</span>
              </div>
              {plugin.category && (
                <div className="detail-item">
                  <span className="detail-label">Category:</span>
                  <span className="detail-value">{plugin.category}</span>
                </div>
              )}
              {plugin.license && (
                <div className="detail-item">
                  <span className="detail-label">License:</span>
                  <span className="detail-value">{plugin.license}</span>
                </div>
              )}
              {plugin.repository && (
                <div className="detail-item">
                  <span className="detail-label">Repository:</span>
                  <a href={plugin.repository} className="detail-link" target="_blank" rel="noopener noreferrer">
                    {plugin.repository}
                  </a>
                </div>
              )}
              {plugin.homepage && (
                <div className="detail-item">
                  <span className="detail-label">Homepage:</span>
                  <a href={plugin.homepage} className="detail-link" target="_blank" rel="noopener noreferrer">
                    {plugin.homepage}
                  </a>
                </div>
              )}
            </div>
          </div>

          {isInstalled && (plugin as InstalledPlugin).componentCounts && (
            <div className="detail-section">
              <h3>Components</h3>
              <div className="component-stats">
                <div className="stat-item">
                  <span className="stat-value">{(plugin as InstalledPlugin).componentCounts!.commands}</span>
                  <span className="stat-label">Commands</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{(plugin as InstalledPlugin).componentCounts!.agents}</span>
                  <span className="stat-label">Agents</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{(plugin as InstalledPlugin).componentCounts!.skills}</span>
                  <span className="stat-label">Skills</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{(plugin as InstalledPlugin).componentCounts!.hooks}</span>
                  <span className="stat-label">Hooks</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{(plugin as InstalledPlugin).componentCounts!.mcpServers}</span>
                  <span className="stat-label">MCP Servers</span>
                </div>
              </div>
            </div>
          )}

          {isInstalled && (
            <div className="detail-section">
              <h3>Installation</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Install Path:</span>
                  <code className="detail-value">{(plugin as InstalledPlugin).installPath}</code>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Installed At:</span>
                  <span className="detail-value">
                    {new Date((plugin as InstalledPlugin).installedAt).toLocaleString()}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status:</span>
                  <span className={`status-badge ${(plugin as InstalledPlugin).enabled ? 'enabled' : 'disabled'}`}>
                    {(plugin as InstalledPlugin).enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {isInstalled ? (
            <>
              <button
                onClick={() => onUninstall(plugin as InstalledPlugin)}
                className="btn-danger"
              >
                Uninstall
              </button>
              <button
                onClick={() => onToggle(plugin as InstalledPlugin, !(plugin as InstalledPlugin).enabled)}
                className="btn-primary"
              >
                {(plugin as InstalledPlugin).enabled ? 'Disable' : 'Enable'}
              </button>
            </>
          ) : (
            <button onClick={() => onInstall(plugin as MarketplacePlugin)} className="btn-primary">
              Install
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
