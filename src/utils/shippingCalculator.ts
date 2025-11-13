import { Package, PriorityLevel, WeightUnit } from '../models/types';

/**
 * Shipping cost calculator utility
 */
export class ShippingCalculator {
  private static readonly BASE_RATES = {
    [PriorityLevel.STANDARD]: 5.0,
    [PriorityLevel.EXPRESS]: 15.0,
    [PriorityLevel.OVERNIGHT]: 30.0,
    [PriorityLevel.SAME_DAY]: 50.0
  };

  private static readonly WEIGHT_RATE_PER_KG = 2.0;
  private static readonly VOLUME_RATE_PER_M3 = 10.0;
  private static readonly FRAGILE_SURCHARGE = 5.0;
  private static readonly INSURANCE_RATE = 0.02; // 2% of value

  /**
   * Calculate shipping cost for a package
   */
  static calculateCost(pkg: Partial<Package>): number {
    let cost = 0;

    // Base rate by priority
    if (pkg.priority) {
      cost += this.BASE_RATES[pkg.priority] || this.BASE_RATES[PriorityLevel.STANDARD];
    }

    // Weight cost
    if (pkg.weight) {
      const weightInKg = this.convertToKg(pkg.weight.value, pkg.weight.unit);
      cost += weightInKg * this.WEIGHT_RATE_PER_KG;
    }

    // Volume cost
    if (pkg.dimensions) {
      const volumeInM3 = this.calculateVolumeM3(pkg.dimensions);
      cost += volumeInM3 * this.VOLUME_RATE_PER_M3;
    }

    // Fragile surcharge
    if (pkg.isFragile) {
      cost += this.FRAGILE_SURCHARGE;
    }

    // Insurance cost
    if (pkg.insuranceRequired && pkg.estimatedValue) {
      cost += pkg.estimatedValue * this.INSURANCE_RATE;
    }

    return parseFloat(cost.toFixed(2));
  }

  /**
   * Convert weight to kg
   */
  private static convertToKg(value: number, unit: WeightUnit): number {
    switch (unit) {
      case WeightUnit.KG:
        return value;
      case WeightUnit.LBS:
        return value * 0.453592;
      case WeightUnit.G:
        return value / 1000;
      case WeightUnit.OZ:
        return value * 0.0283495;
      default:
        return value;
    }
  }

  /**
   * Calculate volume in cubic meters
   */
  private static calculateVolumeM3(dimensions: any): number {
    let length = dimensions.length;
    let width = dimensions.width;
    let height = dimensions.height;

    // Convert to meters
    switch (dimensions.unit) {
      case 'cm':
        length /= 100;
        width /= 100;
        height /= 100;
        break;
      case 'inch':
        length *= 0.0254;
        width *= 0.0254;
        height *= 0.0254;
        break;
    }

    return length * width * height;
  }

  /**
   * Calculate total cost for multiple packages
   */
  static calculateTotalCost(packages: Package[]): number {
    return packages.reduce((total, pkg) => total + this.calculateCost(pkg), 0);
  }

  /**
   * Get cost breakdown
   */
  static getCostBreakdown(pkg: Package): { [key: string]: number } {
    const breakdown: { [key: string]: number } = {};

    if (pkg.priority) {
      breakdown.baseCost = this.BASE_RATES[pkg.priority] || this.BASE_RATES[PriorityLevel.STANDARD];
    }

    if (pkg.weight) {
      const weightInKg = this.convertToKg(pkg.weight.value, pkg.weight.unit);
      breakdown.weightCost = parseFloat((weightInKg * this.WEIGHT_RATE_PER_KG).toFixed(2));
    }

    if (pkg.dimensions) {
      const volumeInM3 = this.calculateVolumeM3(pkg.dimensions);
      breakdown.volumeCost = parseFloat((volumeInM3 * this.VOLUME_RATE_PER_M3).toFixed(2));
    }

    if (pkg.isFragile) {
      breakdown.fragileSurcharge = this.FRAGILE_SURCHARGE;
    }

    if (pkg.insuranceRequired && pkg.estimatedValue) {
      breakdown.insurance = parseFloat((pkg.estimatedValue * this.INSURANCE_RATE).toFixed(2));
    }

    breakdown.total = this.calculateCost(pkg);

    return breakdown;
  }
}
