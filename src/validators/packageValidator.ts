import Joi from 'joi';
import {
  PackageType,
  PriorityLevel,
  DimensionUnit,
  WeightUnit,
  Package,
  Dimensions,
  Weight,
  Address,
  SenderInfo,
  ValidationResult
} from '../models/types';

/**
 * Validation schemas using Joi
 */
export class ValidationSchemas {
  static dimensionsSchema = Joi.object({
    length: Joi.number().positive().max(10000).required(),
    width: Joi.number().positive().max(10000).required(),
    height: Joi.number().positive().max(10000).required(),
    unit: Joi.string().valid(...Object.values(DimensionUnit)).required()
  });

  static weightSchema = Joi.object({
    value: Joi.number().positive().max(100000).required(),
    unit: Joi.string().valid(...Object.values(WeightUnit)).required()
  });

  static addressSchema = Joi.object({
    street: Joi.string().min(3).max(200).required(),
    city: Joi.string().min(2).max(100).required(),
    state: Joi.string().min(2).max(100).required(),
    postalCode: Joi.string().min(3).max(20).required(),
    country: Joi.string().min(2).max(100).required(),
    additionalInfo: Joi.string().max(200).optional()
  });

  static senderInfoSchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().optional(),
    phone: Joi.string().pattern(/^[\d\s\-\+\(\)]+$/).min(10).max(20).optional(),
    address: this.addressSchema.optional()
  });

  static packageSchema = Joi.object({
    id: Joi.string().required(),
    packageType: Joi.string().valid(...Object.values(PackageType)).required(),
    dimensions: this.dimensionsSchema.required(),
    weight: this.weightSchema.required(),
    isFragile: Joi.boolean().required(),
    priority: Joi.string().valid(...Object.values(PriorityLevel)).required(),
    destination: this.addressSchema.required(),
    sender: this.senderInfoSchema.optional(),
    specialInstructions: Joi.string().max(500).optional(),
    estimatedValue: Joi.number().min(0).max(1000000).optional(),
    currency: Joi.string().length(3).uppercase().optional(),
    insuranceRequired: Joi.boolean().required(),
    trackingPreferences: Joi.object({
      emailNotifications: Joi.boolean().required(),
      smsNotifications: Joi.boolean().required(),
      signatureRequired: Joi.boolean().required()
    }).optional(),
    createdAt: Joi.date().required(),
    updatedAt: Joi.date().required()
  });
}

/**
 * Validator class for package data
 */
export class PackageValidator {
  private maxRetries = 3;

  /**
   * Validate dimensions
   */
  validateDimensions(dimensions: Partial<Dimensions>): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    const validation = ValidationSchemas.dimensionsSchema.validate(dimensions);
    
    if (validation.error) {
      result.isValid = false;
      result.errors.push(validation.error.message);
      result.suggestions.push('Please provide length, width, and height as positive numbers with a unit (cm, inch, or m)');
      return result;
    }

    // Check for unrealistic dimensions
    const dims = dimensions as Dimensions;
    if (dims.unit === DimensionUnit.CM) {
      if (dims.length > 500 || dims.width > 500 || dims.height > 500) {
        result.warnings.push('Dimensions seem unusually large for cm. Did you mean meters?');
      }
      if (dims.length < 1 || dims.width < 1 || dims.height < 1) {
        result.warnings.push('Dimensions seem very small. Are you sure about the values?');
      }
    }

    // Calculate volume for warnings
    const volume = dims.length * dims.width * dims.height;
    if (volume > 1000000 && dims.unit === DimensionUnit.CM) {
      result.warnings.push('This is a very large package. Consider using pallet or crate packaging.');
    }

    return result;
  }

  /**
   * Validate weight
   */
  validateWeight(weight: Partial<Weight>): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    const validation = ValidationSchemas.weightSchema.validate(weight);
    
    if (validation.error) {
      result.isValid = false;
      result.errors.push(validation.error.message);
      result.suggestions.push('Please provide weight as a positive number with a unit (kg, lbs, g, or oz)');
      return result;
    }

    const w = weight as Weight;
    
    // Convert to kg for comparison
    let weightInKg = w.value;
    if (w.unit === WeightUnit.LBS) weightInKg *= 0.453592;
    if (w.unit === WeightUnit.G) weightInKg /= 1000;
    if (w.unit === WeightUnit.OZ) weightInKg *= 0.0283495;

    if (weightInKg > 1000) {
      result.warnings.push('This is a very heavy package (>1000kg). Ensure proper handling.');
    }
    if (weightInKg < 0.01) {
      result.warnings.push('Weight seems very light. Please verify.');
    }

    return result;
  }

  /**
   * Validate address
   */
  validateAddress(address: Partial<Address>): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    const validation = ValidationSchemas.addressSchema.validate(address);
    
    if (validation.error) {
      result.isValid = false;
      result.errors.push(validation.error.message);
      result.suggestions.push('Please provide complete address: street, city, state, postal code, and country');
      return result;
    }

    const addr = address as Address;

    // Validate postal code format (basic validation)
    if (addr.country.toLowerCase() === 'usa' || addr.country.toLowerCase() === 'united states') {
      if (!/^\d{5}(-\d{4})?$/.test(addr.postalCode)) {
        result.warnings.push('US postal code format should be XXXXX or XXXXX-XXXX');
      }
    }

    return result;
  }

  /**
   * Validate sender info
   */
  validateSenderInfo(sender: Partial<SenderInfo>): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    const validation = ValidationSchemas.senderInfoSchema.validate(sender);
    
    if (validation.error) {
      result.isValid = false;
      result.errors.push(validation.error.message);
      return result;
    }

    const s = sender as SenderInfo;
    
    if (!s.email && !s.phone) {
      result.warnings.push('No contact information provided. Consider adding email or phone.');
    }

    return result;
  }

  /**
   * Validate package type
   */
  validatePackageType(type: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    const normalizedType = type.toLowerCase().trim();
    const validTypes = Object.values(PackageType);

    if (!validTypes.includes(normalizedType as PackageType)) {
      result.isValid = false;
      result.errors.push(`Invalid package type: ${type}`);
      result.suggestions.push(`Valid types: ${validTypes.join(', ')}`);
    }

    return result;
  }

  /**
   * Validate priority level
   */
  validatePriority(priority: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    const normalizedPriority = priority.toLowerCase().replace(/[_\s-]/g, '_');
    const validPriorities = Object.values(PriorityLevel);

    if (!validPriorities.includes(normalizedPriority as PriorityLevel)) {
      result.isValid = false;
      result.errors.push(`Invalid priority: ${priority}`);
      result.suggestions.push(`Valid priorities: ${validPriorities.join(', ')}`);
    }

    return result;
  }

  /**
   * Cross-validate package data
   */
  crossValidate(pkg: Partial<Package>): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Check if fragile items have insurance
    if (pkg.isFragile && !pkg.insuranceRequired && pkg.estimatedValue && pkg.estimatedValue > 100) {
      result.warnings.push('Fragile items with high value should consider insurance');
      result.suggestions.push('Would you like to add insurance for this fragile package?');
    }

    // Check dimension-to-weight ratio
    if (pkg.dimensions && pkg.weight) {
      const volume = pkg.dimensions.length * pkg.dimensions.width * pkg.dimensions.height;
      let weightInKg = pkg.weight.value;
      if (pkg.weight.unit === WeightUnit.LBS) weightInKg *= 0.453592;
      if (pkg.weight.unit === WeightUnit.G) weightInKg /= 1000;

      const density = weightInKg / (volume / 1000000); // kg/m³
      
      if (density > 1000) {
        result.warnings.push('Package seems very dense. Please verify dimensions and weight.');
      }
      if (density < 1) {
        result.warnings.push('Package seems very light for its size. Please verify.');
      }
    }

    // Check value vs insurance
    if (pkg.estimatedValue && pkg.estimatedValue > 500 && !pkg.insuranceRequired) {
      result.warnings.push('High-value packages typically require insurance');
      result.suggestions.push('Consider adding insurance for packages valued over $500');
    }

    // Check priority vs value
    if (pkg.priority === PriorityLevel.STANDARD && pkg.estimatedValue && pkg.estimatedValue > 1000) {
      result.warnings.push('High-value packages might benefit from express shipping for faster delivery');
    }

    return result;
  }

  /**
   * Validate complete package
   */
  validatePackage(pkg: Package): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    const validation = ValidationSchemas.packageSchema.validate(pkg);
    
    if (validation.error) {
      result.isValid = false;
      result.errors.push(...validation.error.details.map(d => d.message));
      return result;
    }

    // Run cross-validation
    const crossValidation = this.crossValidate(pkg);
    result.warnings.push(...crossValidation.warnings);
    result.suggestions.push(...crossValidation.suggestions);

    return result;
  }
}

export const packageValidator = new PackageValidator();
