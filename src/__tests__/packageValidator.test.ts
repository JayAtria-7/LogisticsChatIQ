import { PackageValidator } from '../validators/packageValidator';
import { DimensionUnit, WeightUnit, PackageType, PriorityLevel } from '../models/types';

describe('PackageValidator', () => {
  let validator: PackageValidator;

  beforeEach(() => {
    validator = new PackageValidator();
  });

  describe('validateDimensions', () => {
    it('should validate correct dimensions', () => {
      const dimensions = {
        length: 10,
        width: 5,
        height: 3,
        unit: DimensionUnit.CM
      };

      const result = validator.validateDimensions(dimensions);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject negative dimensions', () => {
      const dimensions = {
        length: -10,
        width: 5,
        height: 3,
        unit: DimensionUnit.CM
      };

      const result = validator.validateDimensions(dimensions);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should warn about unusually large dimensions', () => {
      const dimensions = {
        length: 600,
        width: 500,
        height: 400,
        unit: DimensionUnit.CM
      };

      const result = validator.validateDimensions(dimensions);
      
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('validateWeight', () => {
    it('should validate correct weight', () => {
      const weight = {
        value: 5,
        unit: WeightUnit.KG
      };

      const result = validator.validateWeight(weight);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject negative weight', () => {
      const weight = {
        value: -5,
        unit: WeightUnit.KG
      };

      const result = validator.validateWeight(weight);
      
      expect(result.isValid).toBe(false);
    });

    it('should warn about very heavy packages', () => {
      const weight = {
        value: 1500,
        unit: WeightUnit.KG
      };

      const result = validator.validateWeight(weight);
      
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('validatePackageType', () => {
    it('should validate correct package types', () => {
      const result = validator.validatePackageType(PackageType.BOX);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid package types', () => {
      const result = validator.validatePackageType('invalid_type');
      expect(result.isValid).toBe(false);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('validatePriority', () => {
    it('should validate correct priority levels', () => {
      const result = validator.validatePriority(PriorityLevel.EXPRESS);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid priority levels', () => {
      const result = validator.validatePriority('super_fast');
      expect(result.isValid).toBe(false);
    });
  });

  describe('crossValidate', () => {
    it('should warn about fragile items without insurance', () => {
      const pkg = {
        isFragile: true,
        insuranceRequired: false,
        estimatedValue: 500
      };

      const result = validator.crossValidate(pkg);
      
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should warn about high-value items without insurance', () => {
      const pkg = {
        estimatedValue: 1000,
        insuranceRequired: false,
        isFragile: false
      };

      const result = validator.crossValidate(pkg);
      
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});
