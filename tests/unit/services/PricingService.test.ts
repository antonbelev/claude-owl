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

    it('should calculate cost for Opus 4 message correctly', () => {
      const message: Message = {
        model: 'claude-opus-4-20250514',
        inputTokens: 100_000, // 100K tokens
        outputTokens: 50_000, // 50K tokens
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
        timestamp: new Date(),
      };

      const cost = pricingService.calculateMessageCost(message);

      // Expected: (100K * $15) + (50K * $75) = $1.5 + $3.75 = $5.25
      expect(cost).toBeCloseTo(5.25, 2);
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

  describe('getModelPricing', () => {
    it('should return pricing for known model', () => {
      const pricing = pricingService.getModelPricing('claude-sonnet-4-5-20250929');

      expect(pricing).toBeDefined();
      expect(pricing?.inputCost).toBe(3.0);
      expect(pricing?.outputCost).toBe(15.0);
      expect(pricing?.cacheCreationCost).toBe(3.75);
      expect(pricing?.cacheReadCost).toBe(0.3);
    });

    it('should return null for unknown model', () => {
      const pricing = pricingService.getModelPricing('unknown-model');

      expect(pricing).toBeNull();
    });
  });

  describe('getKnownModels', () => {
    it('should return list of known models', () => {
      const models = pricingService.getKnownModels();

      expect(models).toContain('claude-sonnet-4-5-20250929');
      expect(models).toContain('claude-opus-4-20250514');
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
