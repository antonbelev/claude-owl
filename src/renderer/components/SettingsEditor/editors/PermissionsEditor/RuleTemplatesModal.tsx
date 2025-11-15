import React, { useEffect } from 'react';
import type { PermissionRule } from '@/shared/types';
import { usePermissionRules } from '../../../../hooks/usePermissionRules';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/renderer/components/ui/dialog';
import { Button } from '@/renderer/components/ui/button';
import { Alert, AlertDescription } from '@/renderer/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/renderer/components/ui/card';
import { Badge } from '@/renderer/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface RuleTemplatesModalProps {
  onApply: (rules: PermissionRule[]) => void;
  onCancel: () => void;
  open: boolean;
}

const getCategoryVariant = (category: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (category) {
    case 'security':
      return 'destructive';
    case 'development':
      return 'default';
    case 'deployment':
      return 'secondary';
    default:
      return 'outline';
  }
};

export const RuleTemplatesModal: React.FC<RuleTemplatesModalProps> = ({ onApply, onCancel, open }) => {
  const { templates, loadingTemplates, error, loadTemplates, applyTemplate } = usePermissionRules();

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open, loadTemplates]);

  const handleApplyTemplate = async (templateId: string) => {
    const rules = await applyTemplate(templateId);
    if (rules) {
      onApply(rules);
    }
  };

  return (
    <Dialog open={open} onOpenChange={open => !open && onCancel()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rule Templates</DialogTitle>
          <DialogDescription>
            Choose from pre-configured security templates to quickly set up permissions
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loadingTemplates && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-neutral-400 mb-3" />
              <p className="text-neutral-600">Loading templates...</p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>Error: {error}</AlertDescription>
            </Alert>
          )}

          {!loadingTemplates && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(template => (
                <Card key={template.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{template.icon}</span>
                        <div>
                          <CardTitle className="text-base">{template.name}</CardTitle>
                        </div>
                      </div>
                      <Badge variant={getCategoryVariant(template.category)}>
                        {template.category}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm">{template.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 space-y-4">
                    <div className="bg-neutral-50 rounded-md p-3">
                      <p className="text-xs font-semibold text-neutral-700 mb-2">
                        Includes {template.rules.length} rules:
                      </p>
                      <ul className="space-y-1">
                        {template.rules.slice(0, 3).map((rule, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-xs">
                            <span>
                              {rule.level === 'allow' && '✅'}
                              {rule.level === 'ask' && '⚠️'}
                              {rule.level === 'deny' && '🚫'}
                            </span>
                            <code className="text-xs bg-white px-1 py-0.5 rounded">
                              {rule.tool}
                              {rule.pattern && `(${rule.pattern})`}
                            </code>
                          </li>
                        ))}
                        {template.rules.length > 3 && (
                          <li className="text-xs text-neutral-500 italic">
                            ...and {template.rules.length - 3} more
                          </li>
                        )}
                      </ul>
                    </div>

                    <Button
                      onClick={() => handleApplyTemplate(template.id)}
                      className="w-full"
                      variant="default"
                    >
                      Apply Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onCancel} variant="secondary">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
