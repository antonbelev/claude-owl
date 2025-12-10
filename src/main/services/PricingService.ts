import type { Message } from '@/shared/types/metrics.types';

interface ModelPricing {
  inputCost: number; // Cost per 1M tokens
  outputCost: number; // Cost per 1M tokens
  cacheCreationCost: number; // Cost per 1M tokens
  cacheReadCost: number; // Cost per 1M tokens
  // Tiered pricing for models with context-based pricing (e.g., Sonnet 4.5)
  extendedContext?: {
    threshold: number; // Context size threshold in tokens
    inputCost: number;
    outputCost: number;
    cacheCreationCost: number;
    cacheReadCost: number;
  };
}

/**
 * PricingService - Calculate costs for Claude API usage
 * Phase 0: Hardcoded pricing (will move to SQLite in Phase 1)
 */
export class PricingService {
  // Pricing data as of December 2025
  // Source: https://www.claude.com/pricing#api
  private readonly PRICING: Record<string, ModelPricing> = {
    // Opus 4.5 (Most intelligent)
    'claude-opus-4-5-20251101': {
      inputCost: 5.0, // $5 per 1M input tokens
      outputCost: 25.0, // $25 per 1M output tokens
      cacheCreationCost: 6.25, // 25% markup on input
      cacheReadCost: 0.5, // 90% discount
    },
    // Legacy Opus 4 naming (map to 4.5 pricing)
    'claude-opus-4-20250514': {
      inputCost: 5.0,
      outputCost: 25.0,
      cacheCreationCost: 6.25,
      cacheReadCost: 0.5,
    },

    // Sonnet 4.5 (Balanced) - Tiered pricing based on context size
    'claude-sonnet-4-5-20250929': {
      // Standard context (≤200K tokens)
      inputCost: 3.0, // $3 per 1M input tokens
      outputCost: 15.0, // $15 per 1M output tokens
      cacheCreationCost: 3.75, // 25% markup on input
      cacheReadCost: 0.3, // 90% discount
      // Extended context (>200K tokens)
      extendedContext: {
        threshold: 200_000,
        inputCost: 6.0,
        outputCost: 22.5,
        cacheCreationCost: 7.5,
        cacheReadCost: 0.6,
      },
    },
    // Legacy Sonnet 3.5
    'claude-sonnet-3-5-20241022': {
      inputCost: 3.0,
      outputCost: 15.0,
      cacheCreationCost: 3.75,
      cacheReadCost: 0.3,
    },

    // Haiku 4.5 (Fastest, most cost-efficient)
    'claude-haiku-4-5-20251001': {
      inputCost: 1.0, // $1 per 1M input tokens
      outputCost: 5.0, // $5 per 1M output tokens
      cacheCreationCost: 1.25, // 25% markup on input
      cacheReadCost: 0.1, // 90% discount
    },
    // Legacy Haiku 3.5
    'claude-haiku-3-5-20241022': {
      inputCost: 0.8,
      outputCost: 4.0,
      cacheCreationCost: 1.0,
      cacheReadCost: 0.08,
    },
  };

  /**
   * Calculate cost for a single message
   * Note: For Sonnet 4.5, we don't have context size info in the message,
   * so we default to standard pricing. In the future, we could track context size.
   */
  calculateMessageCost(message: Message): number {
    const pricing = this.PRICING[message.model];

    if (!pricing) {
      console.warn(`[PricingService] Unknown model: ${message.model}, cost will be $0`);
      return 0;
    }

    // For now, always use standard pricing (not extended context)
    // TODO: Track context size in Message type to support tiered pricing
    const inputCost = (message.inputTokens / 1_000_000) * pricing.inputCost;
    const outputCost = (message.outputTokens / 1_000_000) * pricing.outputCost;
    const cacheCreateCost = (message.cacheCreationTokens / 1_000_000) * pricing.cacheCreationCost;
    const cacheReadCost = (message.cacheReadTokens / 1_000_000) * pricing.cacheReadCost;

    return inputCost + outputCost + cacheCreateCost + cacheReadCost;
  }

  /**
   * Calculate cache savings for a message (what would have been paid without cache)
   */
  calculateCacheSavings(message: Message): number {
    const pricing = this.PRICING[message.model];

    if (!pricing || message.cacheReadTokens === 0) {
      return 0;
    }

    // Cache read saves 90% vs full input cost
    // Savings = (input cost - cache read cost) * cache read tokens
    const savingsPerToken = pricing.inputCost - pricing.cacheReadCost;
    return (message.cacheReadTokens / 1_000_000) * savingsPerToken;
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

  /**
   * Get the cache read cost for a specific model (used by Year in Review)
   */
  getCacheReadCost(modelName: string): number {
    const pricing = this.PRICING[modelName];
    return pricing?.cacheReadCost || 0;
  }

  /**
   * Calculate average cache savings per million tokens across messages
   * Used for aggregate stats when model mix is unknown
   */
  calculateAverageCacheSavingsRate(messages: Message[]): number {
    let totalSavings = 0;
    let totalCacheReadTokens = 0;

    for (const msg of messages) {
      const savings = this.calculateCacheSavings(msg);
      totalSavings += savings;
      totalCacheReadTokens += msg.cacheReadTokens;
    }

    if (totalCacheReadTokens === 0) {
      return 0;
    }

    // Return savings per million cache read tokens
    return (totalSavings / totalCacheReadTokens) * 1_000_000;
  }
}
