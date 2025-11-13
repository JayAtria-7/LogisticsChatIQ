import { ShippingCalculator } from '../utils/shippingCalculator';
import { Package, PriorityLevel, WeightUnit, DimensionUnit, PackageType } from '../models/types';

describe('ShippingCalculator', () => {
  describe('calculateCost', () => {
    it('should calculate basic shipping cost', () => {
      const pkg: Partial<Package> = {
        priority: PriorityLevel.STANDARD,
        weight: { value: 5, unit: WeightUnit.KG },
        dimensions: { length: 10, width: 10, height: 10, unit: DimensionUnit.CM },
        isFragile: false,
        insuranceRequired: false
      };

      const cost = ShippingCalculator.calculateCost(pkg);
      
      expect(cost).toBeGreaterThan(0);
      expect(typeof cost).toBe('number');
    });

    it('should add fragile surcharge', () => {
      const pkgNormal: Partial<Package> = {
        priority: PriorityLevel.STANDARD,
        weight: { value: 5, unit: WeightUnit.KG },
        dimensions: { length: 10, width: 10, height: 10, unit: DimensionUnit.CM },
        isFragile: false,
        insuranceRequired: false
      };

      const pkgFragile: Partial<Package> = {
        ...pkgNormal,
        isFragile: true
      };

      const normalCost = ShippingCalculator.calculateCost(pkgNormal);
      const fragileCost = ShippingCalculator.calculateCost(pkgFragile);
      
      expect(fragileCost).toBeGreaterThan(normalCost);
    });

    it('should add insurance cost', () => {
      const pkgNoInsurance: Partial<Package> = {
        priority: PriorityLevel.STANDARD,
        weight: { value: 5, unit: WeightUnit.KG },
        dimensions: { length: 10, width: 10, height: 10, unit: DimensionUnit.CM },
        isFragile: false,
        insuranceRequired: false,
        estimatedValue: 1000
      };

      const pkgWithInsurance: Partial<Package> = {
        ...pkgNoInsurance,
        insuranceRequired: true
      };

      const normalCost = ShippingCalculator.calculateCost(pkgNoInsurance);
      const insuredCost = ShippingCalculator.calculateCost(pkgWithInsurance);
      
      expect(insuredCost).toBeGreaterThan(normalCost);
    });

    it('should calculate higher cost for express priority', () => {
      const pkgStandard: Partial<Package> = {
        priority: PriorityLevel.STANDARD,
        weight: { value: 5, unit: WeightUnit.KG },
        dimensions: { length: 10, width: 10, height: 10, unit: DimensionUnit.CM },
        isFragile: false,
        insuranceRequired: false
      };

      const pkgExpress: Partial<Package> = {
        ...pkgStandard,
        priority: PriorityLevel.EXPRESS
      };

      const standardCost = ShippingCalculator.calculateCost(pkgStandard);
      const expressCost = ShippingCalculator.calculateCost(pkgExpress);
      
      expect(expressCost).toBeGreaterThan(standardCost);
    });
  });

  describe('getCostBreakdown', () => {
    it('should provide detailed cost breakdown', () => {
      const pkg: Package = {
        id: '123',
        packageType: PackageType.BOX,
        priority: PriorityLevel.EXPRESS,
        weight: { value: 5, unit: WeightUnit.KG },
        dimensions: { length: 10, width: 10, height: 10, unit: DimensionUnit.CM },
        isFragile: true,
        insuranceRequired: true,
        estimatedValue: 500,
        currency: 'USD',
        destination: {
          street: '123 Main St',
          city: 'City',
          state: 'State',
          postalCode: '12345',
          country: 'USA'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const breakdown = ShippingCalculator.getCostBreakdown(pkg);
      
      expect(breakdown).toHaveProperty('baseCost');
      expect(breakdown).toHaveProperty('weightCost');
      expect(breakdown).toHaveProperty('volumeCost');
      expect(breakdown).toHaveProperty('fragileSurcharge');
      expect(breakdown).toHaveProperty('insurance');
      expect(breakdown).toHaveProperty('total');
      
      expect(breakdown.total).toBeGreaterThan(0);
    });
  });
});
