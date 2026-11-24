import { describe, expect, it } from 'vitest';
import type { Measure, ProductVariant } from '../api/types';
import { applyOffer, isWebVariant, packLabel, quote, stockUnit } from './shop';

const variant = (overrides: Partial<ProductVariant> = {}): ProductVariant =>
  ({
    id: 1,
    active: true,
    availableWeb: true,
    finalPrice: 2000,
    currentStock: 5000,
    contentMeasure: 'KG',
    contentAmount: 0,
    packagingOptions: [250, 500, 1000],
    ...overrides,
  }) as ProductVariant;

describe('shop utilities', () => {
  it('only exposes active, web-enabled variants with a positive final price', () => {
    expect(isWebVariant(variant())).toBe(true);
    expect(isWebVariant(variant({ finalPrice: 0 }))).toBe(false);
    expect(isWebVariant(variant({ active: false }))).toBe(false);
  });

  it('formats weight units and labels', () => {
    expect(stockUnit('KG')).toBe('g');
    expect(stockUnit('U')).toBe('u');
    expect(packLabel(250, 'KG')).toBe('250g');
    expect(packLabel(1000, 'KG')).toBe('1kg');
  });

  it('keeps quote calculations for loose and packaged KG sales', () => {
    expect(quote(variant(), null, 500).stockUnits).toBe(500);
    expect(quote(variant(), 250, 2).stockUnits).toBe(500);
  });

  it('applies percentage and fixed discounts without using negative prices', () => {
    const percentage = { discountType: 'PERCENTAGE', discountValue: 10 } as const;
    const fixed = { discountType: 'FIXED', discountValue: 2500 } as const;
    expect(applyOffer(2000, 1, percentage as never)).toBe(1800);
    expect(applyOffer(2000, 1, fixed as never)).toBe(0);
  });

  it('recognizes supported measure values', () => {
    const measures: Measure[] = ['KG', 'U', 'L', 'ML', 'G'];
    expect(measures).toHaveLength(5);
  });
});
