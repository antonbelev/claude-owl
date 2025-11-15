/**
 * HooksPage - Main page for Hooks Manager (Phase 1)
 *
 * Read-only hooks viewing, validation, and template library
 */

import { useState } from 'react';
import { SecurityWarningBanner } from '@/renderer/components/HooksManager/SecurityWarningBanner';
import { HookEventList } from '@/renderer/components/HooksManager/HookEventList';
import { HookTemplateGallery } from '@/renderer/components/HooksManager/HookTemplateGallery';
import { useAllHooks } from '@/renderer/hooks/useHooks';
import { Button } from '@/renderer/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/renderer/components/ui/tabs';
import { Badge } from '@/renderer/components/ui/badge';
import { Alert, AlertDescription } from '@/renderer/components/ui/alert';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '@/renderer/components/common/LoadingSpinner';

export function HooksPage() {
  const { data: events, isLoading, isError, error, refetch, isRefetching } = useAllHooks();
  const [activeTab, setActiveTab] = useState<'hooks' | 'templates'>('hooks');

  return (
    <div className="h-full flex flex-col p-8 bg-white">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-neutral-200">
        <div>
          <h1 className="text-3xl font-semibold text-neutral-900 mb-2">Hooks Manager</h1>
          <p className="text-base text-neutral-600">
            View and manage Claude Code hooks with security validation
          </p>
        </div>
        <Button onClick={() => refetch()} disabled={isRefetching} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
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
                <HookEventList events={events} />
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
        <p className="font-semibold text-blue-900 mb-1">📝 Phase 1: Read-Only Mode</p>
        <p className="text-sm text-blue-800">
          This is Phase 1 implementation focused on viewing and validation. To modify hooks, use the
          &quot;Edit in settings.json&quot; button to open the file in your external editor.
          Template-based editing will be available in Phase 2.
        </p>
      </div>
    </div>
  );
}
