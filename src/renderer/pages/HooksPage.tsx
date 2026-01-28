/**
 * HooksPage - Main page for Hooks Manager
 *
 * Full CRUD support for Claude Code hooks
 */

import { useState } from 'react';
import { SecurityWarningBanner } from '@/renderer/components/HooksManager/SecurityWarningBanner';
import { HookEventList } from '@/renderer/components/HooksManager/HookEventList';
import { HookTemplateGallery } from '@/renderer/components/HooksManager/HookTemplateGallery';
import { HookEditModal } from '@/renderer/components/HooksManager/HookEditModal';
import { useAllHooks, useDeleteHook } from '@/renderer/hooks/useHooks';
import { Button } from '@/renderer/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/renderer/components/ui/tabs';
import { Badge } from '@/renderer/components/ui/badge';
import { Alert, AlertDescription } from '@/renderer/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/renderer/components/ui/dialog';
import { RefreshCw, AlertCircle, Plus } from 'lucide-react';
import { LoadingSpinner } from '@/renderer/components/common/LoadingSpinner';
import type { HookWithMetadata } from '@/shared/types/hook.types';

export function HooksPage() {
  const { data: events, isLoading, isError, error, refetch, isRefetching } = useAllHooks();
  const deleteHook = useDeleteHook();
  const [activeTab, setActiveTab] = useState<'hooks' | 'templates'>('hooks');

  // Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingHook, setEditingHook] = useState<HookWithMetadata | null>(null);
  const [deletingHook, setDeletingHook] = useState<HookWithMetadata | null>(null);

  const handleCreateHook = () => {
    setEditingHook(null);
    setShowEditModal(true);
  };

  const handleEditHook = (hook: HookWithMetadata) => {
    setEditingHook(hook);
    setShowEditModal(true);
  };

  const handleDeleteHook = (hook: HookWithMetadata) => {
    setDeletingHook(hook);
  };

  const confirmDelete = async () => {
    if (!deletingHook) return;

    const hookId = `${deletingHook.event}:${deletingHook.configIndex}:${deletingHook.hookIndex}`;
    const scope = deletingHook.location === 'local' ? 'project' : deletingHook.location;

    try {
      await deleteHook.mutateAsync({
        hookId,
        scope: scope as 'user' | 'project',
      });
      setDeletingHook(null);
    } catch (err) {
      console.error('[HooksPage] Failed to delete hook:', err);
    }
  };

  return (
    <div className="h-full flex flex-col p-8 bg-white">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-neutral-200">
        <div>
          <h1 className="text-3xl font-semibold text-neutral-900 mb-2">Hooks Manager</h1>
          <p className="text-base text-neutral-600">
            Create and manage hooks to customize Claude Code behavior
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} disabled={isRefetching} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleCreateHook}>
            <Plus className="h-4 w-4 mr-2" />
            Create Hook
          </Button>
        </div>
      </div>

      {/* Security Warning */}
      <SecurityWarningBanner />

      {/* Main Content */}
      {isLoading ? (
        <div className="flex-1 py-12">
          <LoadingSpinner size="lg" text="Loading hooks..." />
        </div>
      ) : isError ? (
        <Alert variant="destructive" className="my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold mb-1">Failed to load hooks</div>
            <div className="text-sm">
              {error instanceof Error ? error.message : 'An unknown error occurred'}
            </div>
            <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-3">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={val => setActiveTab(val as 'hooks' | 'templates')}
          className="flex-1"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="hooks" className="relative">
              Configured Hooks
              {events && events.reduce((sum, e) => sum + e.count, 0) > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {events.reduce((sum, e) => sum + e.count, 0)}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          {/* Configured Hooks Tab */}
          <TabsContent value="hooks" className="flex-1">
            {events && events.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-neutral-900">Hook Events</h2>
                    <p className="text-sm text-neutral-600 mt-1">
                      All {events.length} Claude Code hook events
                    </p>
                  </div>
                  <div className="text-sm text-neutral-600">
                    {events.filter(e => e.count > 0).length} events with hooks
                  </div>
                </div>
                <HookEventList
                  events={events}
                  onEditHook={handleEditHook}
                  onDeleteHook={handleDeleteHook}
                />
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-neutral-500">No hook events found</p>
              </div>
            )}
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="flex-1">
            <HookTemplateGallery />
          </TabsContent>
        </Tabs>
      )}

      {/* Footer Note */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="font-semibold text-blue-900 mb-1">Hooks Documentation</p>
        <p className="text-sm text-blue-800">
          Hooks let you customize Claude Code&apos;s behavior by running scripts or prompts at key
          moments. Learn more in the{' '}
          <button
            type="button"
            onClick={() => window.electronAPI.openExternal('https://code.claude.com/docs/en/hooks')}
            className="underline hover:text-blue-900"
          >
            official documentation
          </button>
          .
        </p>
      </div>

      {/* Edit Modal */}
      <HookEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        hook={editingHook}
        onSuccess={() => refetch()}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingHook}
        onOpenChange={(open: boolean) => !open && setDeletingHook(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Hook</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {deletingHook?.event} hook? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingHook(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteHook.isPending}>
              {deleteHook.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
