import { describe, it, expect, beforeEach } from 'vitest';
import { PricingService } from '@/main/services/PricingService';
import type { Message } from '@/shared/types';

describe('PricingService', () => {
  let pricingService: PricingService;

  beforeEach(() => {
    pricingService = new PricingService();
  });

  describe('calculateMessageCost', () => {
    it('should calculate cost for Sonnet 4.5 message correctly', () => {
      const message: Message = {
        model: 'claude-sonnet-4-5-20250929',
        inputTokens: 1_000_000, // 1M tokens
        outputTokens: 500_000, // 500K tokens
        cacheCreationTokens: 100_000, // 100K tokens
        cacheReadTokens: 50_000, // 50K tokens
        timestamp: new Date(),
      };

      const cost = pricingService.calculateMessageCost(message);

      // Expected: (1M * $3) + (500K * $15) + (100K * $3.75) + (50K * $0.3)
      // = $3 + $7.5 + $0.375 + $0.015 = $10.89
      expect(cost).toBeCloseTo(10.89, 2);
    });

    it('should calculate cost for Opus 4.5 message correctly', () => {
      const message: Message = {
        model: 'claude-opus-4-5-20251101',
        inputTokens: 1_000_000, // 1M tokens
        outputTokens: 500_000, // 500K tokens
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
        timestamp: new Date(),
      };

      const cost = pricingService.calculateMessageCost(message);

      // Expected: (1M * $5) + (500K * $25) = $5 + $12.5 = $17.5
      expect(cost).toBeCloseTo(17.5, 2);
    });

    it('should calculate cost for legacy Opus 4 model name correctly', () => {
      const message: Message = {
        model: 'claude-opus-4-20250514',
        inputTokens: 100_000, // 100K tokens
        outputTokens: 50_000, // 50K tokens
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
        timestamp: new Date(),
      };

      const cost = pricingService.calculateMessageCost(message);

      // Expected: (100K * $5) + (50K * $25) = $0.5 + $1.25 = $1.75
      expect(cost).toBeCloseTo(1.75, 2);
    });

    it('should calculate cost for Haiku 4.5 message correctly', () => {
      const message: Message = {
        model: 'claude-haiku-4-5-20251001',
        inputTokens: 1_000_000,
        outputTokens: 500_000,
        cacheCreationTokens: 200_000,
        cacheReadTokens: 100_000,
        timestamp: new Date(),
      };

      const cost = pricingService.calculateMessageCost(message);

      // Expected: (1M * $1.0) + (500K * $5) + (200K * $1.25) + (100K * $0.10)
      // = $1.0 + $2.5 + $0.25 + $0.01 = $3.76
      expect(cost).toBeCloseTo(3.76, 2);
    });

    it('should calculate cost for Haiku 3.5 message correctly', () => {
      const message: Message = {
        model: 'claude-haiku-3-5-20241022',
        inputTokens: 1_000_000,
        outputTokens: 500_000,
        cacheCreationTokens: 200_000,
        cacheReadTokens: 100_000,
        timestamp: new Date(),
      };

      const cost = pricingService.calculateMessageCost(message);

      // Expected: (1M * $0.8) + (500K * $4) + (200K * $1.0) + (100K * $0.08)
      // = $0.8 + $2.0 + $0.2 + $0.008 = $3.008
      expect(cost).toBeCloseTo(3.008, 3);
    });

    it('should return zero cost for unknown model', () => {
      const message: Message = {
        model: 'unknown-model',
        inputTokens: 1_000_000,
        outputTokens: 500_000,
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
        timestamp: new Date(),
      };

      const cost = pricingService.calculateMessageCost(message);

      expect(cost).toBe(0);
    });

    it('should handle zero tokens correctly', () => {
      const message: Message = {
        model: 'claude-sonnet-4-5-20250929',
        inputTokens: 0,
        outputTokens: 0,
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
        timestamp: new Date(),
      };

      const cost = pricingService.calculateMessageCost(message);

      expect(cost).toBe(0);
    });
  });

  describe('calculateCacheSavings', () => {
    it('should calculate cache savings for Sonnet 4.5 correctly', () => {
      const message: Message = {
        model: 'claude-sonnet-4-5-20250929',
        inputTokens: 0,
        outputTokens: 0,
        cacheCreationTokens: 0,
        cacheReadTokens: 1_000_000, // 1M cache read tokens
        timestamp: new Date(),
      };

      const savings = pricingService.calculateCacheSavings(message);

      // Expected: 1M cache read tokens * ($3 input - $0.30 cache read)
      // = 1M * $2.70 = $2.70
      expect(savings).toBeCloseTo(2.7, 2);
    });

    it('should calculate cache savings for Opus 4.5 correctly', () => {
      const message: Message = {
        model: 'claude-opus-4-5-20251101',
        inputTokens: 0,
        outputTokens: 0,
        cacheCreationTokens: 0,
        cacheReadTokens: 1_000_000, // 1M cache read tokens
        timestamp: new Date(),
      };

      const savings = pricingService.calculateCacheSavings(message);

      // Expected: 1M cache read tokens * ($5 input - $0.50 cache read)
      // = 1M * $4.50 = $4.50
      expect(savings).toBeCloseTo(4.5, 2);
    });

    it('should calculate cache savings for Haiku 4.5 correctly', () => {
      const message: Message = {
        model: 'claude-haiku-4-5-20251001',
        inputTokens: 0,
        outputTokens: 0,
        cacheCreationTokens: 0,
        cacheReadTokens: 1_000_000, // 1M cache read tokens
        timestamp: new Date(),
      };

      const savings = pricingService.calculateCacheSavings(message);

      // Expected: 1M cache read tokens * ($1 input - $0.10 cache read)
      // = 1M * $0.90 = $0.90
      expect(savings).toBeCloseTo(0.9, 2);
    });

    it('should return zero savings when no cache reads', () => {
      const message: Message = {
        model: 'claude-sonnet-4-5-20250929',
        inputTokens: 1_000_000,
        outputTokens: 500_000,
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
        timestamp: new Date(),
      };

      const savings = pricingService.calculateCacheSavings(message);

      expect(savings).toBe(0);
    });

    it('should return zero savings for unknown model', () => {
      const message: Message = {
        model: 'unknown-model',
        inputTokens: 0,
        outputTokens: 0,
        cacheCreationTokens: 0,
        cacheReadTokens: 1_000_000,
        timestamp: new Date(),
      };

      const savings = pricingService.calculateCacheSavings(message);

      expect(savings).toBe(0);
    });
  });

  describe('calculateAverageCacheSavingsRate', () => {
    it('should calculate average savings rate across multiple messages', () => {
      const messages: Message[] = [
        {
          model: 'claude-sonnet-4-5-20250929',
          inputTokens: 0,
          outputTokens: 0,
          cacheCreationTokens: 0,
          cacheReadTokens: 1_000_000, // Savings: $2.70
          timestamp: new Date(),
        },
        {
          model: 'claude-opus-4-5-20251101',
          inputTokens: 0,
          outputTokens: 0,
          cacheCreationTokens: 0,
          cacheReadTokens: 1_000_000, // Savings: $4.50
          timestamp: new Date(),
        },
      ];

      const avgRate = pricingService.calculateAverageCacheSavingsRate(messages);

      // Expected: ($2.70 + $4.50) / 2M tokens * 1M = $3.60 per MTok
      expect(avgRate).toBeCloseTo(3.6, 2);
    });

    it('should return zero when no cache reads', () => {
      const messages: Message[] = [
        {
          model: 'claude-sonnet-4-5-20250929',
          inputTokens: 1_000_000,
          outputTokens: 500_000,
          cacheCreationTokens: 0,
          cacheReadTokens: 0,
          timestamp: new Date(),
        },
      ];

      const avgRate = pricingService.calculateAverageCacheSavingsRate(messages);

      expect(avgRate).toBe(0);
    });
  });

  describe('getModelPricing', () => {
    it('should return pricing for Sonnet 4.5 with tiered context', () => {
      const pricing = pricingService.getModelPricing('claude-sonnet-4-5-20250929');

      expect(pricing).toBeDefined();
      expect(pricing?.inputCost).toBe(3.0);
      expect(pricing?.outputCost).toBe(15.0);
      expect(pricing?.cacheCreationCost).toBe(3.75);
      expect(pricing?.cacheReadCost).toBe(0.3);
      expect(pricing?.extendedContext).toBeDefined();
      expect(pricing?.extendedContext?.threshold).toBe(200_000);
      expect(pricing?.extendedContext?.inputCost).toBe(6.0);
      expect(pricing?.extendedContext?.outputCost).toBe(22.5);
    });

    it('should return pricing for Opus 4.5', () => {
      const pricing = pricingService.getModelPricing('claude-opus-4-5-20251101');

      expect(pricing).toBeDefined();
      expect(pricing?.inputCost).toBe(5.0);
      expect(pricing?.outputCost).toBe(25.0);
      expect(pricing?.cacheCreationCost).toBe(6.25);
      expect(pricing?.cacheReadCost).toBe(0.5);
    });

    it('should return pricing for Haiku 4.5', () => {
      const pricing = pricingService.getModelPricing('claude-haiku-4-5-20251001');

      expect(pricing).toBeDefined();
      expect(pricing?.inputCost).toBe(1.0);
      expect(pricing?.outputCost).toBe(5.0);
      expect(pricing?.cacheCreationCost).toBe(1.25);
      expect(pricing?.cacheReadCost).toBe(0.1);
    });

    it('should return null for unknown model', () => {
      const pricing = pricingService.getModelPricing('unknown-model');

      expect(pricing).toBeNull();
    });
  });

  describe('getCacheReadCost', () => {
    it('should return cache read cost for Sonnet 4.5', () => {
      const cost = pricingService.getCacheReadCost('claude-sonnet-4-5-20250929');

      expect(cost).toBe(0.3);
    });

    it('should return cache read cost for Opus 4.5', () => {
      const cost = pricingService.getCacheReadCost('claude-opus-4-5-20251101');

      expect(cost).toBe(0.5);
    });

    it('should return cache read cost for Haiku 4.5', () => {
      const cost = pricingService.getCacheReadCost('claude-haiku-4-5-20251001');

      expect(cost).toBe(0.1);
    });

    it('should return zero for unknown model', () => {
      const cost = pricingService.getCacheReadCost('unknown-model');

      expect(cost).toBe(0);
    });
  });

  describe('getKnownModels', () => {
    it('should return list of known models', () => {
      const models = pricingService.getKnownModels();

      expect(models).toContain('claude-sonnet-4-5-20250929');
      expect(models).toContain('claude-opus-4-20250514');
      expect(models).toContain('claude-opus-4-5-20251101');
      expect(models).toContain('claude-haiku-4-5-20251001');
      expect(models).toContain('claude-haiku-3-5-20241022');
      expect(models).toContain('claude-sonnet-3-5-20241022');
      expect(models.length).toBeGreaterThan(0);
    });

    it('should return same models list on multiple calls', () => {
      const models1 = pricingService.getKnownModels();
      const models2 = pricingService.getKnownModels();

      expect(models1).toEqual(models2);
    });
  });
});
