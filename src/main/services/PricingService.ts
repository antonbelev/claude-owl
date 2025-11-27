import type { Message } from '@/shared/types/metrics.types';

interface ModelPricing {
  inputCost: number; // Cost per 1M tokens
  outputCost: number; // Cost per 1M tokens
  cacheCreationCost: number; // Cost per 1M tokens
  cacheReadCost: number; // Cost per 1M tokens
}

/**
 * PricingService - Calculate costs for Claude API usage
 * Phase 0: Hardcoded pricing (will move to SQLite in Phase 1)
 */
export class PricingService {
  // Pricing data as of November 2025
  // Source: https://www.anthropic.com/pricing
  private readonly PRICING: Record<string, ModelPricing> = {
    'claude-sonnet-4-5-20250929': {
      inputCost: 3.0, // $3 per 1M input tokens
      outputCost: 15.0, // $15 per 1M output tokens
      cacheCreationCost: 3.75, // 25% markup on input
      cacheReadCost: 0.3, // 90% discount (10% of cache creation)
    },
    'claude-opus-4-20250514': {
      inputCost: 15.0,
      outputCost: 75.0,
      cacheCreationCost: 18.75,
      cacheReadCost: 1.5,
    },
    'claude-haiku-4-5-20251001': {
      inputCost: 0.8,
      outputCost: 4.0,
      cacheCreationCost: 1.0,
      cacheReadCost: 0.08,
    },
    'claude-haiku-3-5-20241022': {
      inputCost: 0.8,
      outputCost: 4.0,
      cacheCreationCost: 1.0,
      cacheReadCost: 0.08,
    },
    'claude-sonnet-3-5-20241022': {
      inputCost: 3.0,
      outputCost: 15.0,
      cacheCreationCost: 3.75,
      cacheReadCost: 0.3,
    },
  };

  /**
   * Calculate cost for a single message
   */
  calculateMessageCost(message: Message): number {
    const pricing = this.PRICING[message.model];

    if (!pricing) {
      console.warn(`[PricingService] Unknown model: ${message.model}, cost will be $0`);
      return 0;
    }

    const inputCost = (message.inputTokens / 1_000_000) * pricing.inputCost;
    const outputCost = (message.outputTokens / 1_000_000) * pricing.outputCost;
    const cacheCreateCost =
      (message.cacheCreationTokens / 1_000_000) * pricing.cacheCreationCost;
    const cacheReadCost = (message.cacheReadTokens / 1_000_000) * pricing.cacheReadCost;

    return inputCost + outputCost + cacheCreateCost + cacheReadCost;
  }

  /**
   * Get pricing info for a model (for display purposes)
   */
  getModelPricing(modelName: string): ModelPricing | null {
    return this.PRICING[modelName] || null;
  }

  /**
   * Get list of all known models
   */
  getKnownModels(): string[] {
    return Object.keys(this.PRICING);
  }
}
