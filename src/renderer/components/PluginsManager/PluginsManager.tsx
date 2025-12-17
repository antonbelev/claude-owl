import React, { useState, useMemo } from 'react';
import { usePlugins } from '../../hooks/usePlugins';
import type { MarketplacePlugin, InstalledPlugin, Marketplace } from '@/shared/types';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { PageHeader } from '../common/PageHeader';
import { Card, CardContent, CardHeader, CardFooter } from '@/renderer/components/ui/card';
import { Button } from '@/renderer/components/ui/button';
import { Badge } from '@/renderer/components/ui/badge';
import { Alert, AlertDescription } from '@/renderer/components/ui/alert';
import { Input } from '@/renderer/components/ui/input';
import { Label } from '@/renderer/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/renderer/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/renderer/components/ui/tabs';
import { Checkbox } from '@/renderer/components/ui/checkbox';
import {
  Plug,
  X,
  Grid,
  List,
  Store,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Package,
  ExternalLink,
} from 'lucide-react';

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
    validateMarketplace,
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
  const [selectedPlugin, setSelectedPlugin] = useState<MarketplacePlugin | InstalledPlugin | null>(
    null
  );
  const [uninstallConfirm, setUninstallConfirm] = useState<InstalledPlugin | null>(null);

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
      plugins = plugins.filter(
        p =>
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
        'componentCounts' in p ? (p.componentCounts?.commands ?? 0 > 0) : false
      );
    }
    if (filterHasAgents) {
      plugins = plugins.filter(p =>
        'componentCounts' in p ? (p.componentCounts?.agents ?? 0 > 0) : false
      );
    }
    if (filterHasSkills) {
      plugins = plugins.filter(p =>
        'componentCounts' in p ? (p.componentCounts?.skills ?? 0 > 0) : false
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

  const handleUninstallPlugin = (plugin: InstalledPlugin) => {
    setUninstallConfirm(plugin);
  };

  const handleConfirmUninstall = async () => {
    if (!uninstallConfirm) return;

    const success = await uninstallPlugin(uninstallConfirm.id);
    if (success) {
      setSelectedPlugin(null);
    }
    setUninstallConfirm(null);
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
      <div className="h-full flex flex-col bg-white p-8" data-testid="plugins-manager">
        <PageHeader title="Plugins" description="Browse and manage plugins from marketplaces" />
        <div className="text-center py-16">
          <p className="text-gray-500">Loading plugins...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col bg-white p-8" data-testid="plugins-manager">
        <PageHeader title="Plugins" description="Browse and manage plugins from marketplaces" />
        <div className="text-center py-16">
          <Alert variant="destructive">
            <AlertDescription>Error: {error}</AlertDescription>
          </Alert>
          <Button onClick={refetch} variant="secondary" className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white p-8" data-testid="plugins-manager">
      <div className="flex justify-between items-start mb-8">
        <PageHeader title="Plugins" description="Browse and manage plugins from marketplaces" />
        {activeTab === 'marketplaces' && (
          <Button onClick={() => setShowAddMarketplaceModal(true)}>+ Add Marketplace</Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as TabView)} className="flex-1">
        <TabsList>
          <TabsTrigger value="browse">
            Browse Marketplace
            <Badge variant="secondary" className="ml-2">
              {availablePlugins.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="installed">
            Installed
            <Badge variant="secondary" className="ml-2">
              {installedPlugins.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="marketplaces">
            Marketplaces
            <Badge variant="secondary" className="ml-2">
              {marketplaces.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Search and Filters (for browse and installed tabs) */}
        {(activeTab === 'browse' || activeTab === 'installed') && (
          <div className="mt-6 space-y-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search plugins by name, description, or keywords..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pr-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  title="Clear search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Select value={selectedMarketplace} onValueChange={setSelectedMarketplace}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Marketplaces" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Marketplaces</SelectItem>
                  {marketplaces.map(m => (
                    <SelectItem key={m.name} value={m.name}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {activeTab === 'installed' && (
                <>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={filterHasCommands}
                      onCheckedChange={checked => setFilterHasCommands(checked as boolean)}
                    />
                    Has Commands
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={filterHasAgents}
                      onCheckedChange={checked => setFilterHasAgents(checked as boolean)}
                    />
                    Has Agents
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={filterHasSkills}
                      onCheckedChange={checked => setFilterHasSkills(checked as boolean)}
                    />
                    Has Skills
                  </label>
                </>
              )}

              <div className="flex gap-1 border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  title="Grid view"
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  title="List view"
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {(searchQuery ||
                selectedMarketplace !== 'all' ||
                selectedCategory !== 'all' ||
                filterHasCommands ||
                filterHasAgents ||
                filterHasSkills) && (
                <Button onClick={clearFilters} variant="outline" size="sm">
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <TabsContent value="marketplaces" className="mt-6">
          <MarketplacesView marketplaces={marketplaces} onRemove={removeMarketplace} />
        </TabsContent>

        <TabsContent value="browse" className="mt-6">
          {filteredPlugins.length === 0 ? (
            <div className="text-center py-16">
              <Plug className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Plugins Found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || selectedMarketplace !== 'all' || selectedCategory !== 'all'
                  ? 'No plugins match your search criteria.'
                  : 'No plugins available in the marketplace.'}
              </p>
              {(searchQuery || selectedMarketplace !== 'all' || selectedCategory !== 'all') && (
                <Button onClick={clearFilters}>Clear Filters</Button>
              )}
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                  : 'space-y-3'
              }
            >
              {filteredPlugins.map(plugin => (
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
        </TabsContent>

        <TabsContent value="installed" className="mt-6">
          {filteredPlugins.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Plugins Found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || selectedMarketplace !== 'all' || selectedCategory !== 'all'
                  ? 'No plugins match your search criteria.'
                  : "You haven't installed any plugins yet."}
              </p>
              {(searchQuery || selectedMarketplace !== 'all' || selectedCategory !== 'all') && (
                <Button onClick={clearFilters}>Clear Filters</Button>
              )}
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                  : 'space-y-3'
              }
            >
              {filteredPlugins.map(plugin => (
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
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showAddMarketplaceModal && (
        <AddMarketplaceModal
          onClose={() => setShowAddMarketplaceModal(false)}
          onAdd={addMarketplace}
          onValidate={validateMarketplace}
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

      {uninstallConfirm && (
        <ConfirmDialog
          title="Uninstall Plugin"
          message={`Are you sure you want to uninstall "${uninstallConfirm.name}"?`}
          confirmText="Uninstall"
          cancelText="Cancel"
          isDangerous={true}
          onConfirm={handleConfirmUninstall}
          onCancel={() => setUninstallConfirm(null)}
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
  const [removeConfirm, setRemoveConfirm] = useState<Marketplace | null>(null);

  const handleRemove = (marketplace: Marketplace) => {
    setRemoveConfirm(marketplace);
  };

  const handleConfirmRemove = async () => {
    if (!removeConfirm) return;
    await onRemove(removeConfirm.name);
    setRemoveConfirm(null);
  };

  if (marketplaces.length === 0) {
    return (
      <div className="text-center py-16">
        <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Marketplaces</h3>
        <p className="text-gray-500">Add a marketplace to browse and install plugins.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {marketplaces.map(marketplace => (
        <Card key={marketplace.name}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{marketplace.name}</h3>
                {marketplace.description && (
                  <p className="text-gray-600 mt-1">{marketplace.description}</p>
                )}
              </div>
              <Badge variant={marketplace.available ? 'default' : 'destructive'} className="ml-4">
                {marketplace.available ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Available
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 mr-1" />
                    Unavailable
                  </>
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <span className="text-sm font-semibold text-gray-700">Source:</span>
                <code className="block text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded">
                  {marketplace.source}
                </code>
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-700">Plugins:</span>
                <span className="block text-sm text-gray-600 mt-1">{marketplace.pluginCount}</span>
              </div>
              {marketplace.version && (
                <div>
                  <span className="text-sm font-semibold text-gray-700">Version:</span>
                  <span className="block text-sm text-gray-600 mt-1">{marketplace.version}</span>
                </div>
              )}
            </div>

            {marketplace.error && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>Error: {marketplace.error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={() => handleRemove(marketplace)} variant="destructive" size="sm">
              Remove
            </Button>
          </CardFooter>
        </Card>
      ))}

      {removeConfirm && (
        <ConfirmDialog
          title="Remove Marketplace"
          message={`Are you sure you want to remove the marketplace "${removeConfirm.name}"?`}
          confirmText="Remove"
          cancelText="Cancel"
          isDangerous={true}
          onConfirm={handleConfirmRemove}
          onCancel={() => setRemoveConfirm(null)}
        />
      )}
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
  viewMode: _viewMode,
  onView,
  onInstall,
  onUninstall,
  onToggle,
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
    <Card
      className={`cursor-pointer transition-all hover:border-blue-500 hover:shadow-md ${
        isInstalled && !(plugin as InstalledPlugin).enabled ? 'opacity-60' : ''
      }`}
      onClick={() => onView(plugin)}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-baseline gap-2 flex-1">
            <h3 className="text-lg font-semibold">{plugin.name}</h3>
            {plugin.version && <span className="text-sm text-gray-500">v{plugin.version}</span>}
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <Badge variant="outline" className="shrink-0">
              {marketplaceBadge}
            </Badge>
            {plugin.category && (
              <Badge variant="secondary" className="shrink-0">
                {plugin.category}
              </Badge>
            )}
            {isInstalled && (
              <Badge
                variant={(plugin as InstalledPlugin).enabled ? 'default' : 'secondary'}
                className="shrink-0"
              >
                {(plugin as InstalledPlugin).enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
          {plugin.description || 'No description available'}
        </p>

        {isInstalled && (plugin as InstalledPlugin).componentCounts && (
          <div className="flex flex-wrap gap-2">
            {(plugin as InstalledPlugin).componentCounts!.commands > 0 && (
              <Badge variant="outline" className="text-xs">
                {(plugin as InstalledPlugin).componentCounts!.commands} command(s)
              </Badge>
            )}
            {(plugin as InstalledPlugin).componentCounts!.agents > 0 && (
              <Badge variant="outline" className="text-xs">
                {(plugin as InstalledPlugin).componentCounts!.agents} agent(s)
              </Badge>
            )}
            {(plugin as InstalledPlugin).componentCounts!.skills > 0 && (
              <Badge variant="outline" className="text-xs">
                {(plugin as InstalledPlugin).componentCounts!.skills} skill(s)
              </Badge>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="gap-2">
        {isInstalled ? (
          <>
            <Button onClick={handleToggle} variant="outline" size="sm" className="flex-1">
              {(plugin as InstalledPlugin).enabled ? 'Disable' : 'Enable'}
            </Button>
            <Button onClick={handleUninstall} variant="destructive" size="sm" className="flex-1">
              Uninstall
            </Button>
          </>
        ) : (
          <Button onClick={handleInstall} size="sm" className="w-full">
            {(plugin as MarketplacePlugin).installed ? 'Reinstall' : 'Install'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

// Add Marketplace Modal
interface AddMarketplaceModalProps {
  onClose: () => void;
  onAdd: (name: string, source: string) => Promise<boolean>;
  onValidate: (url: string) => Promise<any>;
}

const AddMarketplaceModal: React.FC<AddMarketplaceModalProps> = ({
  onClose,
  onAdd,
  onValidate,
}) => {
  const [name, setName] = useState('');
  const [source, setSource] = useState('');
  const [adding, setAdding] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleValidate = async () => {
    if (!source.trim()) {
      setError('Please enter a source URL first');
      return;
    }

    setValidating(true);
    setError('');
    setValidationResult(null);

    console.log('[AddMarketplaceModal] Validating:', source.trim());

    const result = await onValidate(source.trim());

    console.log('[AddMarketplaceModal] Validation result:', result);

    setValidationResult(result);
    setValidating(false);

    if (!result || !result.valid) {
      setError(result?.error || 'Validation failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !source.trim()) {
      setError('Name and source are required');
      return;
    }

    setAdding(true);
    setError('');

    console.log('[AddMarketplaceModal] Submitting:', { name: name.trim(), source: source.trim() });

    const success = await onAdd(name.trim(), source.trim());

    if (success) {
      console.log('[AddMarketplaceModal] Marketplace added successfully');
      onClose();
    } else {
      // Show a generic error - the actual error will be logged
      const errorMsg = 'Failed to add marketplace. Please check the console logs for details.';
      console.error('[AddMarketplaceModal] Failed to add marketplace');
      setError(errorMsg);
    }

    setAdding(false);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8"
      onClick={handleOverlayClick}
    >
      <div
        className="bg-white rounded-xl w-full max-w-lg shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-semibold">Add Marketplace</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="marketplace-name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="marketplace-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="my-marketplace"
              required
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="marketplace-source">
              Source <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="marketplace-source"
                type="text"
                value={source}
                onChange={e => {
                  setSource(e.target.value);
                  setValidationResult(null); // Clear validation when source changes
                }}
                placeholder="https://github.com/owner/repo"
                required
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleValidate}
                disabled={validating || !source.trim()}
                variant="outline"
              >
                {validating ? 'Verifying...' : 'Verify'}
              </Button>
            </div>
            <small className="block mt-1 text-sm text-gray-500">
              Repository must contain .claude-plugin/marketplace.json
            </small>
            <small className="block mt-1 text-xs text-gray-400">
              Example: https://github.com/myorg/claude-plugins
            </small>

            {/* Validation Result Display */}
            {validationResult && (
              <div className="mt-3">
                {validationResult.valid ? (
                  <Alert>
                    <AlertDescription className="text-green-700">
                      ✓ Marketplace validated successfully!
                      <div className="mt-1 text-xs text-gray-600">
                        Found marketplace.json at {validationResult.manifestPath}
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <AlertDescription>
                      <div className="font-semibold">✗ Validation Failed</div>
                      <div className="mt-1">{validationResult.error}</div>
                      {validationResult.suggestions && validationResult.suggestions.length > 0 && (
                        <ul className="mt-2 text-xs list-disc list-inside space-y-1">
                          {validationResult.suggestions.map((suggestion: string, i: number) => (
                            <li key={i}>{suggestion}</li>
                          ))}
                        </ul>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" onClick={onClose} variant="secondary" disabled={adding}>
              Cancel
            </Button>
            <Button type="submit" disabled={adding}>
              {adding ? 'Adding...' : 'Add Marketplace'}
            </Button>
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
  onToggle,
}) => {
  const isInstalled = 'id' in plugin;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8"
      onClick={handleOverlayClick}
    >
      <div
        className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-baseline gap-3">
            <h2 className="text-2xl font-semibold">{plugin.name}</h2>
            {plugin.version && <span className="text-lg text-gray-500">v{plugin.version}</span>}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-8">
          <div>
            <h3 className="text-lg font-semibold mb-3">Description</h3>
            <p className="text-gray-600">{plugin.description || 'No description available'}</p>
          </div>

          {plugin.keywords && plugin.keywords.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {plugin.keywords.map((kw: string, idx: number) => (
                  <Badge key={idx} variant="secondary">
                    {kw}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold mb-3">Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-semibold text-gray-700">Marketplace:</span>
                <span className="block text-sm text-gray-600 mt-1">{plugin.marketplace}</span>
              </div>
              {plugin.category && (
                <div>
                  <span className="text-sm font-semibold text-gray-700">Category:</span>
                  <span className="block text-sm text-gray-600 mt-1">{plugin.category}</span>
                </div>
              )}
              {plugin.license && (
                <div>
                  <span className="text-sm font-semibold text-gray-700">License:</span>
                  <span className="block text-sm text-gray-600 mt-1">{plugin.license}</span>
                </div>
              )}
              {plugin.repository && (
                <div>
                  <span className="text-sm font-semibold text-gray-700">Repository:</span>
                  <a
                    href={plugin.repository}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-1"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {plugin.repository}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              {plugin.homepage && (
                <div>
                  <span className="text-sm font-semibold text-gray-700">Homepage:</span>
                  <a
                    href={plugin.homepage}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-1"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {plugin.homepage}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {isInstalled && (plugin as InstalledPlugin).componentCounts && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Components</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {(plugin as InstalledPlugin).componentCounts!.commands}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Commands</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {(plugin as InstalledPlugin).componentCounts!.agents}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Agents</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {(plugin as InstalledPlugin).componentCounts!.skills}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Skills</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {(plugin as InstalledPlugin).componentCounts!.hooks}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Hooks</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {(plugin as InstalledPlugin).componentCounts!.mcpServers}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">MCP Servers</div>
                </div>
              </div>
            </div>
          )}

          {isInstalled && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Installation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-semibold text-gray-700">Install Path:</span>
                  <code className="block text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded">
                    {(plugin as InstalledPlugin).installPath}
                  </code>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-700">Installed At:</span>
                  <span className="block text-sm text-gray-600 mt-1">
                    {new Date((plugin as InstalledPlugin).installedAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-700">Status:</span>
                  <div className="mt-1">
                    <Badge variant={(plugin as InstalledPlugin).enabled ? 'default' : 'secondary'}>
                      {(plugin as InstalledPlugin).enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between p-6 border-t gap-3">
          {isInstalled ? (
            <>
              <Button onClick={() => onUninstall(plugin as InstalledPlugin)} variant="destructive">
                Uninstall
              </Button>
              <Button
                onClick={() =>
                  onToggle(plugin as InstalledPlugin, !(plugin as InstalledPlugin).enabled)
                }
              >
                {(plugin as InstalledPlugin).enabled ? 'Disable' : 'Enable'}
              </Button>
            </>
          ) : (
            <Button onClick={() => onInstall(plugin as MarketplacePlugin)} className="ml-auto">
              Install
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
